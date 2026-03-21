import { participationInclude } from "@/lib/db/includes/participation.include";
import { prisma } from "@/lib/db/prisma";
import { startParticipationSchema } from "@/schemas/participation";
import { ParticipationStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

class ParticipationStartError extends Error {
    constructor(code: string) {
        super(code);
        this.name = "ParticipationStartError";
    }
}

function buildErrorResponse(error: unknown) {
    if (error instanceof ParticipationStartError) {
        switch (error.message) {
            case "USER_NOT_FOUND":
                return NextResponse.json(
                    {
                        message: "Utilisateur introuvable.",
                        error: "USER_NOT_FOUND",
                    },
                    { status: 404 },
                );

            case "USER_NOT_PLAYER":
                return NextResponse.json(
                    {
                        message: "Seul un joueur peut démarrer une chasse.",
                        error: "USER_NOT_PLAYER",
                    },
                    { status: 403 },
                );

            case "HUNT_NOT_FOUND":
                return NextResponse.json(
                    {
                        message: "Chasse introuvable.",
                        error: "HUNT_NOT_FOUND",
                    },
                    { status: 404 },
                );

            case "HUNT_NOT_PUBLIC":
                return NextResponse.json(
                    {
                        message: "Cette chasse n'est pas accessible publiquement.",
                        error: "HUNT_NOT_PUBLIC",
                    },
                    { status: 403 },
                );

            case "HUNT_HAS_NO_STEPS":
                return NextResponse.json(
                    {
                        message: "Impossible de démarrer une chasse sans étapes.",
                        error: "HUNT_HAS_NO_STEPS",
                    },
                    { status: 400 },
                );

            case "PARTICIPATION_ALREADY_EXISTS":
                return NextResponse.json(
                    {
                        message: "Ce joueur a déjà une participation pour cette chasse.",
                        error: "PARTICIPATION_ALREADY_EXISTS",
                    },
                    { status: 409 },
                );
        }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            return NextResponse.json(
                {
                    message: "Cette participation existe déjà.",
                    error: "PARTICIPATION_ALREADY_EXISTS",
                },
                { status: 409 },
            );
        }

        if (error.code === "P2003") {
            return NextResponse.json(
                {
                    message: "Relation invalide lors du démarrage de la participation.",
                    error: "INVALID_RELATION",
                },
                { status: 400 },
            );
        }
    }

    return NextResponse.json(
        {
            message: "Erreur lors du démarrage de la participation.",
            error: "INTERNAL_SERVER_ERROR",
        },
        { status: 500 },
    );
}

async function validateStartParticipation(
    tx: Prisma.TransactionClient,
    userId: string,
    huntId: string,
) {
    const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
        },
    });

    if (!user) {
        throw new ParticipationStartError("USER_NOT_FOUND");
    }

    if (user.role !== "PLAYER") {
        throw new ParticipationStartError("USER_NOT_PLAYER");
    }

    const hunt = await tx.hunt.findUnique({
        where: { id: huntId },
        select: {
            id: true,
            isPublic: true,
            steps: {
                orderBy: {
                    orderIndex: "asc",
                },
                select: {
                    id: true,
                    orderIndex: true,
                },
            },
        },
    });

    if (!hunt) {
        throw new ParticipationStartError("HUNT_NOT_FOUND");
    }

    if (!hunt.isPublic) {
        throw new ParticipationStartError("HUNT_NOT_PUBLIC");
    }

    if (hunt.steps.length === 0) {
        throw new ParticipationStartError("HUNT_HAS_NO_STEPS");
    }

    const existingParticipation = await tx.participation.findUnique({
        where: {
            userId_huntId: {
                userId,
                huntId,
            },
        },
        select: {
            id: true,
        },
    });

    if (existingParticipation) {
        throw new ParticipationStartError("PARTICIPATION_ALREADY_EXISTS");
    }

    return hunt;
}

async function createParticipationWithProgress(
    tx: Prisma.TransactionClient,
    userId: string,
    huntId: string,
    stepIds: string[],
) {
    const participation = await tx.participation.create({
        data: {
            userId,
            huntId,
            status: ParticipationStatus.IN_PROGRESS,
        },
    });

    await tx.stepProgress.createMany({
        data: stepIds.map((stepId) => ({
            participationId: participation.id,
            stepId,
            isCompleted: false,
            cluesUsed: 0,
            pointsEarned: 0,
        })),
    });

    return tx.participation.findUnique({
        where: {
            id: participation.id,
        },
        include: participationInclude,
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = startParticipationSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    message: "Payload invalide.",
                    error: "VALIDATION_ERROR",
                    data: {
                        details: z.flattenError(validation.error),
                    },
                },
                { status: 400 },
            );
        }

        const { userId, huntId } = validation.data;

        const participation = await prisma.$transaction(async (tx) => {
            const hunt = await validateStartParticipation(tx, userId, huntId);

            return createParticipationWithProgress(
                tx,
                userId,
                huntId,
                hunt.steps.map((step) => step.id),
            );
        });

        return NextResponse.json(
            {
                message: "Participation démarrée avec succès.",
                data: participation,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("POST /api/participations/start error:", error);
        return buildErrorResponse(error);
    }
}