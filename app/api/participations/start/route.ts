import { NextRequest, NextResponse } from "next/server";
import { Prisma, ParticipationStatus } from "@prisma/client";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { participationInclude } from "@/lib/prisma-includes";
import { startParticipationSchema } from "@/schemas/participation";

class ParticipationStartError extends Error {
    constructor(code: string) {
        super(code);
        this.name = "ParticipationStartError";
    }
}

function buildErrorResponse(error: unknown) {
    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                ok: false,
                message: "Données invalides.",
                errors: z.flattenError(error),
            },
            { status: 400 }
        );
    }

    if (error instanceof ParticipationStartError) {
        switch (error.message) {
            case "USER_NOT_FOUND":
                return NextResponse.json(
                    {
                        ok: false,
                        message: "Utilisateur introuvable.",
                    },
                    { status: 404 }
                );

            case "USER_NOT_PLAYER":
                return NextResponse.json(
                    {
                        ok: false,
                        message: "Seul un joueur peut démarrer une chasse.",
                    },
                    { status: 403 }
                );

            case "HUNT_NOT_FOUND":
                return NextResponse.json(
                    {
                        ok: false,
                        message: "Chasse introuvable.",
                    },
                    { status: 404 }
                );

            case "HUNT_NOT_PUBLIC":
                return NextResponse.json(
                    {
                        ok: false,
                        message: "Cette chasse n'est pas accessible publiquement.",
                    },
                    { status: 403 }
                );

            case "HUNT_HAS_NO_STEPS":
                return NextResponse.json(
                    {
                        ok: false,
                        message: "Impossible de démarrer une chasse sans étapes.",
                    },
                    { status: 400 }
                );

            case "PARTICIPATION_ALREADY_EXISTS":
                return NextResponse.json(
                    {
                        ok: false,
                        message: "Ce joueur a déjà une participation pour cette chasse.",
                    },
                    { status: 409 }
                );
        }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Cette participation existe déjà.",
                },
                { status: 409 }
            );
        }

        if (error.code === "P2003") {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Relation invalide lors du démarrage de la participation.",
                },
                { status: 400 }
            );
        }
    }

    return NextResponse.json(
        {
            ok: false,
            message: "Erreur lors du démarrage de la participation.",
        },
        { status: 500 }
    );
}

async function validateStartParticipation(tx: Prisma.TransactionClient, userId: string, huntId: string) {
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
    stepIds: string[]
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
        const { userId, huntId } = startParticipationSchema.parse(body);

        const participation = await prisma.$transaction(async (tx) => {
            const hunt = await validateStartParticipation(tx, userId, huntId);

            return createParticipationWithProgress(
                tx,
                userId,
                huntId,
                hunt.steps.map((step) => step.id)
            );
        });

        return NextResponse.json(
            {
                ok: true,
                message: "Participation démarrée avec succès.",
                participation,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/participations/start error:", error);
        return buildErrorResponse(error);
    }
}