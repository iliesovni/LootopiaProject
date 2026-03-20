import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { participationInclude } from "@/lib/prisma-includes";
import { ParticipationStatus } from "@prisma/client";

export async function POST(
    _request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const participation = await prisma.participation.findUnique({
            where: { id },
            include: participationInclude,
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

        const hasRemainingSteps = participation.stepProgress.some(
            (progress) => !progress.isCompleted
        );

        if (hasRemainingSteps) {
            return NextResponse.json(
                { error: "Toutes les étapes doivent être complétées avant de terminer la participation." },
                { status: 409 }
            );
        }

        const updatedParticipation = await prisma.participation.update({
            where: { id: participation.id },
            data: {
                status: ParticipationStatus.COMPLETED,
                completedAt: new Date(),
            },
            include: participationInclude,
        });

        return NextResponse.json({
            message: "Participation terminée avec succès.",
            data: updatedParticipation,
        });
    } catch (error) {
        console.error("[FINISH_PARTICIPATION_ERROR]", error);

        return NextResponse.json(
            { error: "Erreur serveur." },
            { status: 500 }
        );
    }
}