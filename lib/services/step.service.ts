import { clueOwnerDetailSelect } from "@/lib/db/includes/clue.include";
import { stepOwnerDetailSelect, stepPublicSelect } from "@/lib/db/includes/step.include";
import { prisma } from "@/lib/db/prisma";
import { HuntStatus, ParticipationStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export class StepNotFoundError extends Error {
    constructor() {
        super("STEP_NOT_FOUND");
    }
}

export class StepForbiddenError extends Error {
    constructor() {
        super("FORBIDDEN_RESOURCE");
    }
}

export class StepNotEditableError extends Error {
    constructor() {
        super("STEP_NOT_EDITABLE");
    }
}

export class HuntNotFoundError extends Error {
    constructor() {
        super("HUNT_NOT_FOUND");
    }
}

export class InvalidStepOrderError extends Error {
    constructor() {
        super("INVALID_STEP_ORDER");
    }
}

type CreateStepInput = {
    huntId: string;
    currentUserId: string;
    data: {
        title: string;
        description: string;
        latitude: number;
        longitude: number;
        radiusMeters: number;
        orderIndex: number;
        pointsReward: number;
        huntId: string;
        arMarkerType?: "IMAGE" | "PATTERN" | "MODEL_3D" | null;
        arAssetUrl?: string | null;
    };
};

type UpdateStepInput = {
    stepId: string;
    currentUserId: string;
    data: Prisma.StepUpdateInput & {
        orderIndex?: number;
    };
};

type DeleteStepInput = {
    stepId: string;
    currentUserId: string;
};

type GetStepInput = {
    stepId: string;
    currentUserId: string;
};

type ListAccessibleStepsInput = {
    currentUserId: string;
};

type ListStepCluesInput = {
    stepId: string;
    currentUserId: string;
};

async function assertEditableHunt(
    tx: Prisma.TransactionClient,
    huntId: string,
    currentUserId: string,
) {
    const hunt = await tx.hunt.findUnique({
        where: { id: huntId },
        select: {
            id: true,
            createdById: true,
            status: true,
            isDeleted: true,
        },
    });

    if (!hunt || hunt.isDeleted) {
        throw new HuntNotFoundError();
    }

    if (hunt.createdById !== currentUserId) {
        throw new StepForbiddenError();
    }

    if (hunt.status === HuntStatus.PUBLISHED) {
        throw new StepNotEditableError();
    }

    return hunt;
}

async function assertReadableStep(stepId: string, currentUserId: string) {
    const step = await prisma.step.findUnique({
        where: { id: stepId },
        select: {
            id: true,
            huntId: true,
            hunt: {
                select: {
                    id: true,
                    createdById: true,
                    isDeleted: true,
                },
            },
        },
    });

    if (!step || step.hunt.isDeleted) {
        throw new StepNotFoundError();
    }

    const isOwner = step.hunt.createdById === currentUserId;

    if (isOwner) {
        return step;
    }

    const participation = await prisma.participation.findUnique({
        where: {
            userId_huntId: {
                userId: currentUserId,
                huntId: step.huntId,
            },
        },
        select: {
            id: true,
            status: true,
        },
    });

    if (!participation) {
        throw new StepForbiddenError();
    }

    if (
        participation.status !== ParticipationStatus.IN_PROGRESS &&
        participation.status !== ParticipationStatus.ABANDONED &&
        participation.status !== ParticipationStatus.COMPLETED
    ) {
        throw new StepForbiddenError();
    }

    return step;
}

// TODO: endpoint à revoir → ne devrait probablement pas exposer toutes les steps globalement
export async function listAccessibleSteps({ currentUserId }: ListAccessibleStepsInput) {
    return prisma.step.findMany({
        where: {
            hunt: {
                isDeleted: false,
                OR: [
                    { createdById: currentUserId },
                    {
                        participations: {
                            some: {
                                userId: currentUserId,
                            },
                        },
                    },
                ],
            },
        },
        select: stepPublicSelect,
        orderBy: [{ huntId: "asc" }, { orderIndex: "asc" }],
    });
}

export async function getStepById({ stepId, currentUserId }: GetStepInput) {
    const baseStep = await assertReadableStep(stepId, currentUserId);

    const isOwner = baseStep.hunt.createdById === currentUserId;

    const step = await prisma.step.findUnique({
        where: { id: stepId },
        select: isOwner ? stepOwnerDetailSelect : stepPublicSelect,
    });

    if (!step) {
        throw new StepNotFoundError();
    }

    return step;
}

export async function createStep({ huntId, currentUserId, data }: CreateStepInput) {
    return prisma.$transaction(async (tx) => {
        await assertEditableHunt(tx, huntId, currentUserId);

        try {
            return await tx.step.create({
                data: {
                    title: data.title,
                    description: data.description,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    radiusMeters: data.radiusMeters,
                    orderIndex: data.orderIndex,
                    pointsReward: data.pointsReward,
                    arMarkerType: data.arMarkerType ?? null,
                    arAssetUrl: data.arAssetUrl ?? null,
                    hunt: {
                        connect: {
                            id: huntId,
                        },
                    },
                },
                select: stepOwnerDetailSelect,
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                throw new InvalidStepOrderError();
            }

            throw error;
        }
    });
}

export async function updateStep({ stepId, currentUserId, data }: UpdateStepInput) {
    return prisma.$transaction(async (tx) => {
        const existingStep = await tx.step.findUnique({
            where: { id: stepId },
            select: {
                id: true,
                huntId: true,
                orderIndex: true,
            },
        });

        if (!existingStep) {
            throw new StepNotFoundError();
        }

        await assertEditableHunt(tx, existingStep.huntId, currentUserId);

        const { orderIndex, ...otherUpdates } = data;

        if (orderIndex === undefined || orderIndex === existingStep.orderIndex) {
            return tx.step.update({
                where: { id: stepId },
                data: otherUpdates,
                select: stepOwnerDetailSelect,
            });
        }

        const stepsCount = await tx.step.count({
            where: { huntId: existingStep.huntId },
        });

        const targetOrderIndex = Math.min(
            Math.max(orderIndex, 1),
            stepsCount,
        );

        await tx.step.update({
            where: { id: stepId },
            data: {
                orderIndex: 0,
            },
        });

        if (targetOrderIndex < existingStep.orderIndex) {
            await tx.step.updateMany({
                where: {
                    huntId: existingStep.huntId,
                    orderIndex: {
                        gte: targetOrderIndex,
                        lt: existingStep.orderIndex,
                    },
                },
                data: {
                    orderIndex: {
                        increment: 1,
                    },
                },
            });
        }

        if (targetOrderIndex > existingStep.orderIndex) {
            await tx.step.updateMany({
                where: {
                    huntId: existingStep.huntId,
                    orderIndex: {
                        gt: existingStep.orderIndex,
                        lte: targetOrderIndex,
                    },
                },
                data: {
                    orderIndex: {
                        decrement: 1,
                    },
                },
            });
        }

        return tx.step.update({
            where: { id: stepId },
            data: {
                ...otherUpdates,
                orderIndex: targetOrderIndex,
            },
            select: stepOwnerDetailSelect,
        });
    });
}

export async function deleteStep({ stepId, currentUserId }: DeleteStepInput) {
    return prisma.$transaction(async (tx) => {
        const existingStep = await tx.step.findUnique({
            where: { id: stepId },
            select: {
                id: true,
                huntId: true,
                orderIndex: true,
            },
        });

        if (!existingStep) {
            throw new StepNotFoundError();
        }

        await assertEditableHunt(tx, existingStep.huntId, currentUserId);

        await tx.step.delete({
            where: { id: stepId },
        });

        await tx.step.updateMany({
            where: {
                huntId: existingStep.huntId,
                orderIndex: {
                    gt: existingStep.orderIndex,
                },
            },
            data: {
                orderIndex: {
                    decrement: 1,
                },
            },
        });
    });
}

export async function listCluesForStep({ stepId, currentUserId }: ListStepCluesInput) {
    const step = await prisma.step.findUnique({
        where: { id: stepId },
        select: {
            id: true,
            hunt: {
                select: {
                    createdById: true,
                    isDeleted: true,
                },
            },
        },
    });

    if (!step || step.hunt.isDeleted) {
        throw new StepNotFoundError();
    }

    if (step.hunt.createdById !== currentUserId) {
        throw new StepForbiddenError();
    }

    return prisma.clue.findMany({
        where: { stepId },
        select: clueOwnerDetailSelect,
        orderBy: {
            orderIndex: "asc",
        },
    });
}

export function mapStepError(error: unknown) {
    if (error instanceof HuntNotFoundError) {
        return NextResponse.json(
            {
                message: "Chasse introuvable.",
                error: "HUNT_NOT_FOUND",
            },
            { status: 404 },
        );
    }

    if (error instanceof StepNotFoundError) {
        return NextResponse.json(
            {
                message: "Étape introuvable.",
                error: "STEP_NOT_FOUND",
            },
            { status: 404 },
        );
    }

    if (error instanceof StepForbiddenError) {
        return NextResponse.json(
            {
                message: "Accès refusé à cette étape.",
                error: "STEP_FORBIDDEN",
            },
            { status: 403 },
        );
    }

    if (error instanceof StepNotEditableError) {
        return NextResponse.json(
            {
                message: "Cette chasse est publiée et ne peut plus être modifiée.",
                error: "HUNT_NOT_EDITABLE",
            },
            { status: 409 },
        );
    }

    if (error instanceof InvalidStepOrderError) {
        return NextResponse.json(
            {
                message: "Une étape avec ce numéro d'ordre existe déjà dans cette chasse.",
                error: "INVALID_STEP_ORDER",
            },
            { status: 409 },
        );
    }

    return null;
}