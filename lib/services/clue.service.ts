import { clueOwnerDetailSelect } from "@/lib/db/includes/clue.include";
import { prisma } from "@/lib/db/prisma";
import { HuntStatus, Prisma } from "@prisma/client";

export class ClueNotFoundError extends Error {
    constructor() {
        super("CLUE_NOT_FOUND");
    }
}

export class ClueForbiddenError extends Error {
    constructor() {
        super("FORBIDDEN_RESOURCE");
    }
}

export class ClueNotEditableError extends Error {
    constructor() {
        super("CLUE_NOT_EDITABLE");
    }
}

export class StepNotFoundError extends Error {
    constructor() {
        super("STEP_NOT_FOUND");
    }
}

export class ClueOrderConflictError extends Error {
    constructor() {
        super("CLUE_ORDER_CONFLICT");
    }
}

export class ClueLimitReachedError extends Error {
    constructor() {
        super("CLUE_LIMIT_REACHED");
    }
}

type CreateClueInput = {
    currentUserId: string;
    data: {
        content: string;
        penaltyPoints: number;
        stepId: string;
        orderIndex?: number;
    };
};

type UpdateClueInput = {
    clueId: string;
    currentUserId: string;
    data: Prisma.ClueUpdateInput & {
        orderIndex?: number;
    };
};

type DeleteClueInput = {
    clueId: string;
    currentUserId: string;
};

type GetClueInput = {
    clueId: string;
    currentUserId: string;
};

async function assertEditableStep(
    tx: Prisma.TransactionClient,
    stepId: string,
    currentUserId: string,
) {
    const step = await tx.step.findUnique({
        where: { id: stepId },
        select: {
            id: true,
            stepProgress: false,
            huntId: true,
            hunt: {
                select: {
                    id: true,
                    createdById: true,
                    status: true,
                    isDeleted: true,
                },
            },
        },
    });

    if (!step || step.hunt.isDeleted) {
        throw new StepNotFoundError();
    }

    if (step.hunt.createdById !== currentUserId) {
        throw new ClueForbiddenError();
    }

    if (step.hunt.status === HuntStatus.PUBLISHED) {
        throw new ClueNotEditableError();
    }

    return step;
}

async function assertOwnerReadableClue(clueId: string, currentUserId: string) {
    const clue = await prisma.clue.findUnique({
        where: { id: clueId },
        select: {
            id: true,
            step: {
                select: {
                    hunt: {
                        select: {
                            createdById: true,
                            isDeleted: true,
                        },
                    },
                },
            },
        },
    });

    if (!clue || clue.step.hunt.isDeleted) {
        throw new ClueNotFoundError();
    }

    if (clue.step.hunt.createdById !== currentUserId) {
        throw new ClueForbiddenError();
    }

    return clue;
}

export async function getClueById({ clueId, currentUserId }: GetClueInput) {
    await assertOwnerReadableClue(clueId, currentUserId);

    const clue = await prisma.clue.findUnique({
        where: { id: clueId },
        select: clueOwnerDetailSelect,
    });

    if (!clue) {
        throw new ClueNotFoundError();
    }

    return clue;
}

export async function createClue({ currentUserId, data }: CreateClueInput) {
    return prisma.$transaction(async (tx) => {
        const step = await assertEditableStep(tx, data.stepId, currentUserId);

        const cluesCount = await tx.clue.count({
            where: { stepId: step.id },
        });

        if (cluesCount >= 3) {
            throw new ClueLimitReachedError();
        }

        let finalOrderIndex = data.orderIndex;

        if (finalOrderIndex === undefined) {
            const lastClue = await tx.clue.findFirst({
                where: { stepId: step.id },
                orderBy: { orderIndex: "desc" },
                select: { orderIndex: true },
            });

            finalOrderIndex = lastClue ? lastClue.orderIndex + 1 : 1;
        } else {
            const existingClueAtSameIndex = await tx.clue.findFirst({
                where: {
                    stepId: step.id,
                    orderIndex: finalOrderIndex,
                },
                select: { id: true },
            });

            if (existingClueAtSameIndex) {
                throw new ClueOrderConflictError();
            }
        }

        return tx.clue.create({
            data: {
                ...data,
                orderIndex: finalOrderIndex,
            },
            select: clueOwnerDetailSelect,
        });
    });
}

export async function updateClue({ clueId, currentUserId, data }: UpdateClueInput) {
    return prisma.$transaction(async (tx) => {
        const existingClue = await tx.clue.findUnique({
            where: { id: clueId },
            select: {
                id: true,
                stepId: true,
                orderIndex: true,
            },
        });

        if (!existingClue) {
            throw new ClueNotFoundError();
        }

        await assertEditableStep(tx, existingClue.stepId, currentUserId);

        const { orderIndex, ...otherUpdates } = data;

        if (orderIndex === undefined || orderIndex === existingClue.orderIndex) {
            return tx.clue.update({
                where: { id: clueId },
                data: otherUpdates,
                select: clueOwnerDetailSelect,
            });
        }

        const cluesCount = await tx.clue.count({
            where: { stepId: existingClue.stepId },
        });

        const targetOrderIndex = Math.min(
            Math.max(orderIndex, 1),
            cluesCount,
        );

        await tx.clue.update({
            where: { id: clueId },
            data: {
                orderIndex: 0,
            },
        });

        if (targetOrderIndex < existingClue.orderIndex) {
            await tx.clue.updateMany({
                where: {
                    stepId: existingClue.stepId,
                    orderIndex: {
                        gte: targetOrderIndex,
                        lt: existingClue.orderIndex,
                    },
                },
                data: {
                    orderIndex: {
                        increment: 1,
                    },
                },
            });
        }

        if (targetOrderIndex > existingClue.orderIndex) {
            await tx.clue.updateMany({
                where: {
                    stepId: existingClue.stepId,
                    orderIndex: {
                        gt: existingClue.orderIndex,
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

        return tx.clue.update({
            where: { id: clueId },
            data: {
                ...otherUpdates,
                orderIndex: targetOrderIndex,
            },
            select: clueOwnerDetailSelect,
        });
    });
}

export async function deleteClue({ clueId, currentUserId }: DeleteClueInput) {
    return prisma.$transaction(async (tx) => {
        const existingClue = await tx.clue.findUnique({
            where: { id: clueId },
            select: {
                id: true,
                stepId: true,
                orderIndex: true,
            },
        });

        if (!existingClue) {
            throw new ClueNotFoundError();
        }

        await assertEditableStep(tx, existingClue.stepId, currentUserId);

        await tx.clue.delete({
            where: { id: clueId },
        });

        await tx.clue.updateMany({
            where: {
                stepId: existingClue.stepId,
                orderIndex: {
                    gt: existingClue.orderIndex,
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