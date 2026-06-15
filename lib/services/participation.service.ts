import { apiError } from "@/lib/api/responses";
import { huntPreGameSelect } from "@/lib/db/includes/hunt.include";
import {
    participationProgressInternalSelect,
    participationPublicSelect,
} from "@/lib/db/includes/participation.include";
import { prisma } from "@/lib/db/prisma";
import { HuntStatus, HuntVisibility, ParticipationStatus, Prisma, Role } from "@prisma/client";

export class ParticipationError extends Error {
    constructor(code: string) {
        super(code);
        this.name = "ParticipationError";
    }
}

const MAX_ACCESS_CODE_ATTEMPTS = 10;

type ClueLike = {
    content: string;
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
    accessCode?: string | null;
};

type StartableHunt = {
    id: string;
    status: HuntStatus;
    visibility: HuntVisibility;
    accessCode: string | null;
    isDeleted: boolean;
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

type ApplyClueInput = {
    participationId: string;
    userId: string;
    stepId: string;
};

type FinishParticipationInput = {
    participationId: string;
    userId: string;
};

type GetParticipationInput = {
    participationId: string;
    userId: string;
};

type AbandonParticipationInput = {
    participationId: string;
    userId: string;
};

type ParticipationPublicStepProgress = {
    stepId: string;
    isCompleted: boolean;
    cluesUsed: number;
    pointsEarned: number;
    completedAt: Date | null;
    step: {
        id: string;
        title: string;
        orderIndex: number;
        pointsReward: number;
    } | null;
};

type ParticipationPublicView = {
    id: string;
    status: ParticipationStatus;
    totalScore: number;
    startedAt: Date;
    completedAt: Date | null;
    huntId: string;
    userId: string;
    hunt: {
        id: string;
        title: string;
        location: string | null;
        difficulty: string | null;
        bannerUrl: string | null;
    } | null;
    stepProgress: ParticipationPublicStepProgress[];
};

type ListMyParticipationsOptions = {
    status?: ParticipationStatus;
};

export async function getMyParticipations(
    currentUserId: string,
    options?: ListMyParticipationsOptions,
) {
    return prisma.participation.findMany({
        where: {
            userId: currentUserId,
            ...(options?.status ? { status: options.status } : {}),
        },
        select: participationPublicSelect,
        orderBy: {
            startedAt: "desc",
        },
    });
}

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

async function validateStartParticipation(tx: Prisma.TransactionClient, userId: string, huntId: string, accessCode?: string | null): Promise<StartableHunt> {
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
            status: true,
            visibility: true,
            accessCode: true,
            isDeleted: true,
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

    if (!hunt || hunt.isDeleted) {
        throw new ParticipationError("HUNT_NOT_FOUND");
    }

    if (hunt.status !== HuntStatus.PUBLISHED) {
        throw new ParticipationError("HUNT_NOT_PUBLISHED");
    }

    const accessAttempt = await getAccessAttempt(tx, userId, huntId);

    if (hunt.visibility === HuntVisibility.PRIVATE && accessAttempt && accessAttempt.failedAttempts >= MAX_ACCESS_CODE_ATTEMPTS) {
        throw new ParticipationError("ACCESS_CODE_ATTEMPTS_EXCEEDED");
    }

    if (hunt.visibility === HuntVisibility.PRIVATE) {
        if (!accessCode) {
            throw new ParticipationError("ACCESS_CODE_REQUIRED");
        }

        if (hunt.accessCode !== accessCode) {
            const updatedAttempt = await registerFailedAccessAttempt(tx, userId, huntId);

            if (updatedAttempt.failedAttempts >= MAX_ACCESS_CODE_ATTEMPTS) {
                throw new ParticipationError("ACCESS_CODE_ATTEMPTS_EXCEEDED");
            }

            throw new ParticipationError("INVALID_ACCESS_CODE");
        }

        await clearAccessAttempts(tx, userId, huntId);
    }

    if (hunt.steps.length === 0) {
        throw new ParticipationError("HUNT_HAS_NO_STEPS");
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
        select: participationPublicSelect,
    });

    if (!createdParticipation) {
        throw new ParticipationError("PARTICIPATION_NOT_FOUND");
    }

    return buildParticipationGameplayView(createdParticipation);
}

export async function getParticipationById({ participationId, userId }: GetParticipationInput) {
    const participation = await prisma.participation.findUnique({
        where: { id: participationId },
        select: participationPublicSelect,
    });

    if (!participation) {
        throw new ParticipationError("PARTICIPATION_NOT_FOUND");
    }

    if (participation.userId !== userId) {
        throw new ParticipationError("PARTICIPATION_FORBIDDEN");
    }

    return buildParticipationGameplayView(participation);
}

export async function getParticipationPreGame({ participationId, userId }: GetParticipationInput) {
    const participation = await prisma.participation.findUnique({
        where: { id: participationId },
        select: participationPublicSelect,
    });

    if (!participation) {
        throw new ParticipationError("PARTICIPATION_NOT_FOUND");
    }

    if (participation.userId !== userId) {
        throw new ParticipationError("PARTICIPATION_FORBIDDEN");
    }

    const hunt = await prisma.hunt.findUnique({
        where: { id: participation.huntId },
        select: huntPreGameSelect,
    });

    if (!hunt) {
        throw new ParticipationError("HUNT_NOT_FOUND");
    }

    const participants = await prisma.participation.findMany({
        where: {
            huntId: participation.huntId,
        },
        select: {
            id: true,
            totalScore: true,
            status: true,
            user: {
                select: {
                    username: true,
                },
            },
        },
        orderBy: [
            { totalScore: "desc" },
            { startedAt: "asc" },
        ],
    });

    return {
        participation: {
            ...buildParticipationGameplayView(participation),
            stepProgress: participation.stepProgress,
        },
        hunt,
        participants: participants.map((entry) => ({
            participationId: entry.id,
            username: entry.user.username,
            totalScore: entry.totalScore,
            status: entry.status,
            isCurrentUser: entry.id === participationId,
        })),
    };
}

function mapStepCluesForGameplay(
    clues: Array<{ content: string; penaltyPoints: number; orderIndex: number }>,
    cluesUsed: number,
) {
    return clues.map((clue, index) => ({
        orderIndex: clue.orderIndex,
        penaltyPoints: clue.penaltyPoints,
        content: index < cluesUsed ? clue.content : undefined,
    }));
}

export async function getParticipationGameplay({ participationId, userId }: GetParticipationInput) {
    const participation = await prisma.participation.findUnique({
        where: { id: participationId },
        select: participationProgressInternalSelect,
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

    const currentProgress = participation.stepProgress.find((progress) => !progress.isCompleted) ?? null;
    const completedStepsCount = participation.stepProgress.filter((progress) => progress.isCompleted).length;

    return {
        participation: {
            id: participation.id,
            status: participation.status,
            totalScore: participation.totalScore,
            huntId: participation.huntId,
            completedStepsCount,
            totalStepsCount: participation.stepProgress.length,
            currentStep: currentProgress?.step
                ? {
                      stepId: currentProgress.stepId,
                      cluesUsed: currentProgress.cluesUsed,
                      step: {
                          id: currentProgress.step.id,
                          title: currentProgress.step.title,
                          description: currentProgress.step.description,
                          latitude: currentProgress.step.latitude,
                          longitude: currentProgress.step.longitude,
                          radiusMeters: currentProgress.step.radiusMeters,
                          orderIndex: currentProgress.step.orderIndex,
                          pointsReward: currentProgress.step.pointsReward,
                          clues: mapStepCluesForGameplay(
                              currentProgress.step.clues,
                              currentProgress.cluesUsed,
                          ),
                      },
                  }
                : null,
        },
        hunt: participation.hunt,
    };
}

export async function startParticipation({ userId, huntId, accessCode }: StartParticipationInput) {
    try {
        return await prisma.$transaction(async (tx) => {
            const hunt = await validateStartParticipation(
                tx,
                userId,
                huntId,
                accessCode,
            );

            const existingParticipation = await tx.participation.findUnique({
                where: {
                    userId_huntId: {
                        userId,
                        huntId,
                    },
                },
                select: participationPublicSelect,
            });

            if (existingParticipation) {
                if (existingParticipation.status === ParticipationStatus.ABANDONED) {
                    const resumedParticipation = await tx.participation.update({
                        where: { id: existingParticipation.id },
                        data: {
                            status: ParticipationStatus.IN_PROGRESS,
                        },
                        select: participationPublicSelect,
                    });

                    return buildParticipationGameplayView(resumedParticipation);
                }

                throw new ParticipationError("PARTICIPATION_ALREADY_EXISTS");
            }

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
        select: participationProgressInternalSelect,
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

export async function applyClue({ participationId, userId, stepId }: ApplyClueInput) {
    const participation = await prisma.participation.findUnique({
        where: { id: participationId },
        select: participationProgressInternalSelect,
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
        clue: {
            content: nextClue.content,
        },
        cluesUsed: updatedProgress.cluesUsed,
        remainingClues: clues.length - updatedProgress.cluesUsed,
    };
}

export async function finishParticipation({ participationId, userId }: FinishParticipationInput) {
    const participation = await prisma.participation.findUnique({
        where: { id: participationId },
        select: participationPublicSelect,
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

    const updatedParticipation = await prisma.participation.update({
        where: { id: participationId },
        data: {
            status: ParticipationStatus.COMPLETED,
            completedAt: new Date(),
        },
        select: participationPublicSelect,
    });

    return buildParticipationGameplayView(updatedParticipation);
}

export async function abandonParticipation({
                                               participationId,
                                               userId,
                                           }: AbandonParticipationInput) {
    const participation = await prisma.participation.findUnique({
        where: { id: participationId },
        select: participationPublicSelect,
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

    const updatedParticipation = await prisma.participation.update({
        where: { id: participationId },
        data: {
            status: ParticipationStatus.ABANDONED,
        },
        select: participationPublicSelect,
    });

    return buildParticipationGameplayView(updatedParticipation);
}

function buildParticipationGameplayView(participation: ParticipationPublicView) {
    const completedSteps = participation.stepProgress.filter(
        (progress) => progress.isCompleted,
    );

    const currentStep =
        participation.status === ParticipationStatus.IN_PROGRESS
            ? participation.stepProgress.find((progress) => !progress.isCompleted) ?? null
            : null;

    return {
        id: participation.id,
        status: participation.status,
        totalScore: participation.totalScore,
        startedAt: participation.startedAt,
        completedAt: participation.completedAt,
        huntId: participation.huntId,
        userId: participation.userId,
        hunt: participation.hunt,
        currentStep,
        completedSteps,
    };
}

async function getAccessAttempt(tx: Prisma.TransactionClient, userId: string, huntId: string) {
    return tx.huntAccessAttempt.findUnique({
        where: {
            userId_huntId: {
                userId,
                huntId,
            },
        },
        select: {
            id: true,
            failedAttempts: true,
        },
    });
}

async function registerFailedAccessAttempt(tx: Prisma.TransactionClient, userId: string, huntId: string) {
    return tx.huntAccessAttempt.upsert({
        where: {
            userId_huntId: {
                userId,
                huntId,
            },
        },
        create: {
            userId,
            huntId,
            failedAttempts: 1,
        },
        update: {
            failedAttempts: {
                increment: 1,
            },
        },
        select: {
            failedAttempts: true,
        },
    });
}

async function clearAccessAttempts(tx: Prisma.TransactionClient, userId: string, huntId: string) {
    await tx.huntAccessAttempt.deleteMany({
        where: {
            userId,
            huntId,
        },
    });
}

export function mapParticipationError(error: unknown) {
    if (error instanceof ParticipationError) {
        switch (error.message) {
            case "USER_NOT_FOUND":
                return apiError(
                    "Utilisateur introuvable.",
                    "USER_NOT_FOUND",
                    404,
                );

            case "USER_NOT_PLAYER":
                return apiError(
                    "Seul un joueur peut démarrer une chasse.",
                    "USER_NOT_PLAYER",
                    403,
                );

            case "HUNT_NOT_FOUND":
                return apiError(
                    "Chasse introuvable.",
                    "HUNT_NOT_FOUND",
                    404,
                );

            case "HUNT_NOT_PUBLISHED":
                return apiError(
                    "Cette chasse n'est pas encore publiée.",
                    "HUNT_NOT_PUBLISHED",
                    409,
                );

            case "ACCESS_CODE_REQUIRED":
                return apiError(
                    "Un code d'accès est requis pour cette chasse privée.",
                    "ACCESS_CODE_REQUIRED",
                    403,
                );

            case "INVALID_ACCESS_CODE":
                return apiError(
                    "Le code d'accès fourni est invalide.",
                    "INVALID_ACCESS_CODE",
                    403,
                );

            case "HUNT_HAS_NO_STEPS":
                return apiError(
                    "Impossible de démarrer une chasse sans étapes.",
                    "HUNT_HAS_NO_STEPS",
                    400,
                );

            case "PARTICIPATION_ALREADY_EXISTS":
                return apiError(
                    "Ce joueur a déjà une participation pour cette chasse.",
                    "PARTICIPATION_ALREADY_EXISTS",
                    409,
                );

            case "INVALID_RELATION":
                return apiError(
                    "Relation invalide lors du démarrage de la participation.",
                    "INVALID_RELATION",
                    400,
                );

            case "PARTICIPATION_NOT_IN_PROGRESS":
                return apiError(
                    "La participation n'est pas en cours.",
                    "PARTICIPATION_NOT_IN_PROGRESS",
                    409,
                );

            case "STEP_NOT_IN_PARTICIPATION":
                return apiError(
                    "Cette étape n'appartient pas à la participation.",
                    "STEP_NOT_IN_PARTICIPATION",
                    404,
                );

            case "STEP_MISCONFIGURED":
                return apiError(
                    "Étape mal configurée.",
                    "STEP_MISCONFIGURED",
                    500,
                );

            case "STEP_ALREADY_COMPLETED":
                return apiError(
                    "Cette étape est déjà complétée.",
                    "STEP_ALREADY_COMPLETED",
                    409,
                );

            case "STEP_OUT_OF_ORDER":
                return apiError(
                    "Impossible d'effectuer cette action sur cette étape maintenant.",
                    "STEP_OUT_OF_ORDER",
                    409,
                );

            case "PARTICIPATION_NOT_FOUND":
                return apiError(
                    "Participation introuvable.",
                    "PARTICIPATION_NOT_FOUND",
                    404,
                );

            case "PARTICIPATION_FORBIDDEN":
                return apiError(
                    "Vous n'avez pas accès à cette participation.",
                    "PARTICIPATION_FORBIDDEN",
                    403,
                );

            case "NO_MORE_CLUES_AVAILABLE":
                return apiError(
                    "Tous les indices ont déjà été utilisés.",
                    "NO_MORE_CLUES_AVAILABLE",
                    409,
                );

            case "PARTICIPATION_HAS_REMAINING_STEPS":
                return apiError(
                    "Toutes les étapes doivent être complétées avant de terminer la participation.",
                    "PARTICIPATION_HAS_REMAINING_STEPS",
                    409,
                );

            case "ACCESS_CODE_ATTEMPTS_EXCEEDED":
                return apiError(
                    "Le nombre maximum de tentatives pour ce code d'accès a été atteint.",
                    "ACCESS_CODE_ATTEMPTS_EXCEEDED",
                    403,
                );
        }
    }

    return null;
}