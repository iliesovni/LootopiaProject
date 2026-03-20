import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { participationProgressInclude } from "@/lib/prisma-includes";
import { ParticipationStatus } from "@prisma/client";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        const { stepId } = body;

        if (!stepId) {
            return NextResponse.json(
                { error: "stepId requis." },
                { status: 400 }
            );
        }

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

        if (participation.status !== ParticipationStatus.IN_PROGRESS) {
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
                { error: "Impossible d'utiliser un indice pour cette étape maintenant." },
                { status: 409 }
            );
        }

        const clues = targetProgress.step.clues;

        if (targetProgress.cluesUsed >= clues.length) {
            return NextResponse.json(
                { error: "Tous les indices ont déjà été utilisés." },
                { status: 409 }
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
        console.error("[USE_CLUE_ERROR]", error);

        return NextResponse.json(
            { error: "Erreur serveur." },
            { status: 500 }
        );
    }
}