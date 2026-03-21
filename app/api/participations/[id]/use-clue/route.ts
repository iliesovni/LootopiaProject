import { apiValidationError } from "@/lib/api/validation";
import { participationProgressInclude } from "@/lib/db/includes/participation.include";
import { prisma } from "@/lib/db/prisma";
import { getTargetStepProgress, mapParticipationError } from "@/lib/services/participation.service";
import { useClueSchema } from "@/schemas/participation";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        const validation = useClueSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const { stepId } = validation.data;

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

        if (targetProgress.cluesUsed >= clues.length) {
            return NextResponse.json(
                {
                    message: "Tous les indices ont déjà été utilisés.",
                    error: "NO_MORE_CLUES_AVAILABLE",
                },
                { status: 409 },
            );
        }

        const nextClue = clues[targetProgress.cluesUsed];

        const updatedProgress = await prisma.stepProgress.update({
            where: {
                participationId_stepId: {
                    participationId: participation.id,
                    stepId,
                },
            },
            data: {
                cluesUsed: {
                    increment: 1,
                },
            },
        });

        return NextResponse.json({
            message: "Indice utilisé avec succès.",
            data: {
                clue: nextClue,
                cluesUsed: updatedProgress.cluesUsed,
                remainingClues: clues.length - updatedProgress.cluesUsed,
            },
        });
    } catch (error) {
        const mappedError = mapParticipationError(error);
        if (mappedError) {
            return mappedError;
        }

        console.error("[USE_CLUE_ERROR]", error);

        return NextResponse.json(
            {
                message: "Erreur serveur.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}