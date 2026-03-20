import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { completeStepSchema } from "@/schemas/participation";
import { participationProgressInclude } from "@/lib/prisma-includes";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const logContext: {
        participationId: string | null;
        stepId: string | null;
    } = {
        participationId: null,
        stepId: null,
    };

    try {
        const params = await context.params;
        const id = params.id;
        logContext.participationId = id;

        const body = await request.json();

        const validation = completeStepSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Payload invalide.",
                    details: validation.error.issues,
                },
                { status: 400 }
            );
        }

        const stepId = validation.data.stepId;
        logContext.stepId = stepId;

        const participation = await prisma.participation.findUnique({
            where: { id },
            include: participationProgressInclude,
        });

        if (!participation) {
            return NextResponse.json(
                { error: "Participation introuvable." },
                { status: 404 }
            );
        }

        if (participation.status !== "IN_PROGRESS") {
            return NextResponse.json(
                { error: "La participation n'est pas en cours." },
                { status: 409 }
            );
        }

        const targetProgress = participation.stepProgress.find(
            (progress) => progress.stepId === stepId
        );

        if (!targetProgress) {
            return NextResponse.json(
                { error: "Cette étape n'appartient pas à la participation." },
                { status: 404 }
            );
        }

        if (!targetProgress.step) {
            return NextResponse.json(
                { error: "Step mal configurée." },
                { status: 500 }
            );
        }

        if (targetProgress.isCompleted) {
            return NextResponse.json(
                { error: "Cette étape est déjà complétée." },
                { status: 409 }
            );
        }

        const nextExpectedProgress = participation.stepProgress.find(
            (progress) => !progress.isCompleted
        );

        if (!nextExpectedProgress || nextExpectedProgress.stepId !== stepId) {
            return NextResponse.json(
                { error: "Cette étape ne peut pas être complétée maintenant." },
                { status: 409 }
            );
        }

        const safeCluesUsed = Math.min(
            targetProgress.cluesUsed,
            targetProgress.step.clues.length
        );

        const clues = targetProgress.step.clues;

        const penalties = clues
            .slice(0, safeCluesUsed)
            .reduce((sum, clue) => sum + clue.penaltyPoints, 0);

        const pointsEarned = Math.max(
            0,
            targetProgress.step.pointsReward - penalties
        );

        const result = await prisma.$transaction(async (tx) => {
            const updatedStepProgress = await tx.stepProgress.update({
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
                updatedStepProgress,
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
        console.error("[COMPLETE_STEP_ERROR]", {
            ...logContext,
            error,
        });

        return NextResponse.json(
            { error: "Erreur serveur." },
            { status: 500 }
        );
    }
}