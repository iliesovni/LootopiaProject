import { participationInclude, participationProgressInclude } from "@/lib/db/includes/participation.include";
import { prisma } from "@/lib/db/prisma";
import { ParticipationStatus, Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";

export class ParticipationError extends Error {
    constructor(code: string) {
        super(code);
        this.name = "ParticipationError";
    }
}

type ClueLike = {
    penaltyPoints: number;
    orderIndex: number;
};

type StepLike = {
    clues: ClueLike[];
    pointsReward: number;
};

type StepProgressWithNullableStep = {
    stepId: string;
    isCompleted: boolean;
    cluesUsed: number;
    step: StepLike | null;
};

type StepProgressWithStep = {
    stepId: string;
    isCompleted: boolean;
    cluesUsed: number;
    step: StepLike;
};

type ParticipationWithProgress = {
    status: ParticipationStatus;
    stepProgress: StepProgressWithNullableStep[];
};

type StartParticipationInput = {
    userId: string;
    huntId: string;
};

type StartableHunt = {
    id: string;
    isPublic: boolean;
    steps: {
        id: string;
        orderIndex: number;
    }[];
};

type CompleteStepInput = {
    participationId: string;
    userId: string;
    stepId: string;
};

type UseClueInput = {
    participationId: string;
    userId: string;
    stepId: string;
};

type FinishParticipationInput = {
    participationId: string;
    userId: string;
};

export function getTargetStepProgress(
    participation: ParticipationWithProgress,
    stepId: string,
): StepProgressWithStep {
    if (participation.status !== ParticipationStatus.IN_PROGRESS) {
        throw new ParticipationError("PARTICIPATION_NOT_IN_PROGRESS");
    }

    const targetProgress = participation.stepProgress.find(
        (progress) => progress.stepId === stepId,
    );

    if (!targetProgress) {
        throw new ParticipationError("STEP_NOT_IN_PARTICIPATION");
    }

    if (!targetProgress.step) {
        throw new ParticipationError("STEP_MISCONFIGURED");
    }

    if (targetProgress.isCompleted) {
        throw new ParticipationError("STEP_ALREADY_COMPLETED");
    }

    const nextExpectedProgress = participation.stepProgress.find(
        (progress) => !progress.isCompleted,
    );

    if (!nextExpectedProgress || nextExpectedProgress.stepId !== stepId) {
        throw new ParticipationError("STEP_OUT_OF_ORDER");
    }

    return {
        ...targetProgress,
        step: targetProgress.step,
    };
}

async function validateStartParticipation(
    tx: Prisma.TransactionClient,
    userId: string,
    huntId: string,
): Promise<StartableHunt> {
    const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
        },
    });

    if (!user) {
        throw new ParticipationError("USER_NOT_FOUND");
    }

    if (user.role !== Role.PLAYER) {
        throw new ParticipationError("USER_NOT_PLAYER");
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
        throw new ParticipationError("HUNT_NOT_FOUND");
    }

    if (!hunt.isPublic) {
        throw new ParticipationError("HUNT_NOT_PUBLIC");
    }

    if (hunt.steps.length === 0) {
        throw new ParticipationError("HUNT_HAS_NO_STEPS");
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
        throw new ParticipationError("PARTICIPATION_ALREADY_EXISTS");
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

    const createdParticipation = await tx.participation.findUnique({
        where: {
            id: participation.id,
        },
        include: participationInclude,
    });

    if (!createdParticipation) {
        throw new ParticipationError("PARTICIPATION_NOT_FOUND");
    }

    return createdParticipation;
}

export async function startParticipation({ userId, huntId }: StartParticipationInput) {
    try {
        return await prisma.$transaction(async (tx) => {
            const hunt = await validateStartParticipation(tx, userId, huntId);

            return createParticipationWithProgress(
                tx,
                userId,
                huntId,
                hunt.steps.map((step) => step.id),
            );
        });
    } catch (error) {
        if (error instanceof ParticipationError) {
            throw error;
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                throw new ParticipationError("PARTICIPATION_ALREADY_EXISTS");
            }

            if (error.code === "P2003") {
                throw new ParticipationError("INVALID_RELATION");
            }
        }

        throw error;
    }
}

export async function completeStep({ participationId, userId, stepId }: CompleteStepInput) {
    const participation = await prisma.participation.findUnique({
        where: { id: participationId },
        include: participationProgressInclude,
    });

    if (!participation) {
        throw new ParticipationError("PARTICIPATION_NOT_FOUND");
    }

    if (participation.userId !== userId) {
        throw new ParticipationError("PARTICIPATION_FORBIDDEN");
    }

    const targetProgress = getTargetStepProgress(participation, stepId);
    const clues = targetProgress.step.clues;

    const safeCluesUsed = Math.min(targetProgress.cluesUsed, clues.length);

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
                    participationId,
                    stepId,
                },
            },
            data: {
                isCompleted: true,
                completedAt: new Date(),
                pointsEarned,
            },
        });

        return tx.participation.update({
            where: { id: participationId },
            data: {
                totalScore: {
                    increment: pointsEarned,
                },
            },
            select: {
                id: true,
                totalScore: true,
            },
        });
    });

    return {
        participationId,
        stepId,
        pointsEarned,
        totalScore: result.totalScore,
    };
}

export async function useClue({
                                  participationId,
                                  userId,
                                  stepId,
                              }: UseClueInput) {
    const participation = await prisma.participation.findUnique({
        where: { id: participationId },
        include: participationProgressInclude,
    });

    if (!participation) {
        throw new ParticipationError("PARTICIPATION_NOT_FOUND");
    }

    if (participation.userId !== userId) {
        throw new ParticipationError("PARTICIPATION_FORBIDDEN");
    }

    const targetProgress = getTargetStepProgress(participation, stepId);
    const clues = targetProgress.step.clues;

    if (targetProgress.cluesUsed >= clues.length) {
        throw new ParticipationError("NO_MORE_CLUES_AVAILABLE");
    }

    const nextClue = clues[targetProgress.cluesUsed];

    const updatedProgress = await prisma.stepProgress.update({
        where: {
            participationId_stepId: {
                participationId,
                stepId,
            },
        },
        data: {
            cluesUsed: {
                increment: 1,
            },
        },
        select: {
            cluesUsed: true,
        },
    });

    return {
        clue: nextClue,
        cluesUsed: updatedProgress.cluesUsed,
        remainingClues: clues.length - updatedProgress.cluesUsed,
    };
}

export async function finishParticipation({
                                              participationId,
                                              userId,
                                          }: FinishParticipationInput) {
    const participation = await prisma.participation.findUnique({
        where: { id: participationId },
        include: participationInclude,
    });

    if (!participation) {
        throw new ParticipationError("PARTICIPATION_NOT_FOUND");
    }

    if (participation.userId !== userId) {
        throw new ParticipationError("PARTICIPATION_FORBIDDEN");
    }

    if (participation.status !== ParticipationStatus.IN_PROGRESS) {
        throw new ParticipationError("PARTICIPATION_NOT_IN_PROGRESS");
    }

    const hasRemainingSteps = participation.stepProgress.some(
        (progress) => !progress.isCompleted,
    );

    if (hasRemainingSteps) {
        throw new ParticipationError("PARTICIPATION_HAS_REMAINING_STEPS");
    }

    return prisma.participation.update({
        where: { id: participationId },
        data: {
            status: ParticipationStatus.COMPLETED,
            completedAt: new Date(),
        },
        include: participationInclude,
    });
}

export function mapParticipationError(error: unknown) {
    if (error instanceof ParticipationError) {
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

            case "INVALID_RELATION":
                return NextResponse.json(
                    {
                        message: "Relation invalide lors du démarrage de la participation.",
                        error: "INVALID_RELATION",
                    },
                    { status: 400 },
                );

            case "PARTICIPATION_NOT_IN_PROGRESS":
                return NextResponse.json(
                    {
                        message: "La participation n'est pas en cours.",
                        error: "PARTICIPATION_NOT_IN_PROGRESS",
                    },
                    { status: 409 },
                );

            case "STEP_NOT_IN_PARTICIPATION":
                return NextResponse.json(
                    {
                        message: "Cette étape n'appartient pas à la participation.",
                        error: "STEP_NOT_IN_PARTICIPATION",
                    },
                    { status: 404 },
                );

            case "STEP_MISCONFIGURED":
                return NextResponse.json(
                    {
                        message: "Step mal configurée.",
                        error: "STEP_MISCONFIGURED",
                    },
                    { status: 500 },
                );

            case "STEP_ALREADY_COMPLETED":
                return NextResponse.json(
                    {
                        message: "Cette étape est déjà complétée.",
                        error: "STEP_ALREADY_COMPLETED",
                    },
                    { status: 409 },
                );

            case "STEP_OUT_OF_ORDER":
                return NextResponse.json(
                    {
                        message: "Impossible d'effectuer cette action sur cette étape maintenant.",
                        error: "STEP_OUT_OF_ORDER",
                    },
                    { status: 409 },
                );

            case "PARTICIPATION_NOT_FOUND":
                return NextResponse.json(
                    {
                        message: "Participation introuvable.",
                        error: "PARTICIPATION_NOT_FOUND",
                    },
                    { status: 404 },
                );

            case "PARTICIPATION_FORBIDDEN":
                return NextResponse.json(
                    {
                        message: "Vous n'avez pas accès à cette participation.",
                        error: "PARTICIPATION_FORBIDDEN",
                    },
                    { status: 403 },
                );

            case "NO_MORE_CLUES_AVAILABLE":
                return NextResponse.json(
                    {
                        message: "Tous les indices ont déjà été utilisés.",
                        error: "NO_MORE_CLUES_AVAILABLE",
                    },
                    { status: 409 },
                );

            case "PARTICIPATION_HAS_REMAINING_STEPS":
                return NextResponse.json(
                    {
                        message: "Toutes les étapes doivent être complétées avant de terminer la participation.",
                        error: "PARTICIPATION_HAS_REMAINING_STEPS",
                    },
                    { status: 409 },
                );

        }
    }

    return null;
}