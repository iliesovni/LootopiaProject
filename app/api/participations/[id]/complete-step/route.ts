import { apiValidationError } from "@/lib/api/validation";
import { participationProgressInclude } from "@/lib/db/includes/participation.include";
import { prisma } from "@/lib/db/prisma";
import { getTargetStepProgress, mapParticipationError } from "@/lib/services/participation.service";
import { completeStepSchema } from "@/schemas/participation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const logContext: {
        participationId: string | null;
        stepId: string | null;
    } = {
        participationId: null,
        stepId: null,
    };

    try {
        const { id } = await context.params;
        logContext.participationId = id;

        const body = await request.json();

        const validation = completeStepSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const { stepId } = validation.data;
        logContext.stepId = stepId;

        const participation = await prisma.participation.findUnique({
            where: { id },
            include: participationProgressInclude,
        });

        if (!participation) {
            return NextResponse.json(
                {
                    message: "Participation introuvable.",
                    error: "PARTICIPATION_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        const targetProgress = getTargetStepProgress(participation, stepId);
        const clues = targetProgress.step.clues;

        const safeCluesUsed = Math.min(
            targetProgress.cluesUsed,
            clues.length,
        );

        const penalties = clues
        .slice(0, safeCluesUsed)
        .reduce(
            (sum: number, clue: { penaltyPoints: number }) =>
                sum + clue.penaltyPoints,
            0,
        );

        const pointsEarned = Math.max(
            0,
            targetProgress.step.pointsReward - penalties,
        );

        const result = await prisma.$transaction(async (tx) => {
            await tx.stepProgress.update({
                where: {
                    participationId_stepId: {
                        participationId: participation.id,
                        stepId,
                    },
                },
                data: {
                    isCompleted: true,
                    completedAt: new Date(),
                    pointsEarned,
                },
            });

            const updatedParticipation = await tx.participation.update({
                where: { id: participation.id },
                data: {
                    totalScore: {
                        increment: pointsEarned,
                    },
                },
            });

            return {
                updatedParticipation,
            };
        });

        return NextResponse.json({
            message: "Étape complétée avec succès.",
            data: {
                participationId: participation.id,
                stepId,
                pointsEarned,
                totalScore: result.updatedParticipation.totalScore,
            },
        });
    } catch (error) {
        const mappedError = mapParticipationError(error);
        if (mappedError) {
            return mappedError;
        }

        console.error("[COMPLETE_STEP_ERROR]", {
            ...logContext,
            error,
        });

        return NextResponse.json(
            {
                message: "Erreur serveur.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}