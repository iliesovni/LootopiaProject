import { huntOwnerDetailSelect } from "@/lib/db/includes/hunt.include";
import { prisma } from "@/lib/db/prisma";
import { HuntStatus, Prisma } from "@prisma/client";

export class HuntNotFoundError extends Error {
    constructor() {
        super("HUNT_NOT_FOUND");
    }
}

export class HuntForbiddenError extends Error {
    constructor() {
        super("FORBIDDEN_RESOURCE");
    }
}

export class HuntNotEditableError extends Error {
    constructor() {
        super("HUNT_NOT_EDITABLE");
    }
}

type UpdateHuntInput = {
    huntId: string;
    currentUserId: string;
    data: Prisma.HuntUpdateInput;
};

type DeleteHuntInput = {
    huntId: string;
    currentUserId: string;
};

export async function updateHunt({ huntId, currentUserId, data }: UpdateHuntInput) {
    const existingHunt = await prisma.hunt.findUnique({
        where: { id: huntId },
    });

    if (!existingHunt) {
        throw new HuntNotFoundError();
    }

    if (existingHunt.createdById !== currentUserId) {
        throw new HuntForbiddenError();
    }

    if (existingHunt.status === HuntStatus.PUBLISHED) {
        throw new HuntNotEditableError();
    }

    return prisma.hunt.update({
        where: { id: huntId },
        data,
        select: huntOwnerDetailSelect,
    });
}

export async function deleteHunt({ huntId, currentUserId }: DeleteHuntInput) {
    const existingHunt = await prisma.hunt.findUnique({
        where: { id: huntId },
    });

    if (!existingHunt) {
        throw new HuntNotFoundError();
    }

    if (existingHunt.createdById !== currentUserId) {
        throw new HuntForbiddenError();
    }

    await prisma.hunt.update({
        where: { id: huntId },
        data: { isDeleted: true },
    });
}