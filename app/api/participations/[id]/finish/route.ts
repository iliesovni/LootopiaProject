import { participationInclude } from "@/lib/db/includes/participation.include";
import { prisma } from "@/lib/db/prisma";
import { ParticipationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;

        const participation = await prisma.participation.findUnique({
            where: { id },
            include: participationInclude,
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

        if (participation.status !== ParticipationStatus.IN_PROGRESS) {
            return NextResponse.json(
                {
                    message: "La participation n'est pas en cours.",
                    error: "PARTICIPATION_NOT_IN_PROGRESS",
                },
                { status: 409 },
            );
        }

        const hasRemainingSteps = participation.stepProgress.some(
            (progress) => !progress.isCompleted,
        );

        if (hasRemainingSteps) {
            return NextResponse.json(
                {
                    message: "Toutes les étapes doivent être complétées avant de terminer la participation.",
                    error: "PARTICIPATION_HAS_REMAINING_STEPS",
                },
                { status: 409 },
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
            {
                message: "Erreur serveur.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}