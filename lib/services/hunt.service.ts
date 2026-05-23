import { apiError } from "@/lib/api/responses";
import { huntOwnerDetailSelect, huntPublicDetailSelect, huntPublicListSelect } from "@/lib/db/includes/hunt.include";
import { prisma } from "@/lib/db/prisma";
import { HuntStatus, HuntVisibility, Prisma, Role } from "@prisma/client";

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

export class HuntPublishError extends Error {
    constructor(
        public code:
            | "HUNT_NOT_FOUND"
            | "FORBIDDEN"
            | "HUNT_DELETED"
            | "HUNT_ALREADY_PUBLISHED"
            | "HUNT_NOT_DRAFT"
            | "HUNT_NOT_ENOUGH_STEPS"
            | "HUNT_MISSING_ACCESS_CODE"
            | "HUNT_INVALID_STEP_ORDER",
    ) {
        super(code);
        this.name = "HuntPublishError";
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
    currentUserRole: Role;
};

type GetHuntByIdInput = {
    huntId: string;
    currentUserId?: string;
};

function hasSequentialStepOrder(steps: Array<{ orderIndex: number }>) {
    return steps.every((step, index) => step.orderIndex === index);
}

export async function getPublicHunts() {
    return prisma.hunt.findMany({
        where: {
            status: HuntStatus.PUBLISHED,
            visibility: "PUBLIC",
            isDeleted: false,
        },
        select: huntPublicListSelect,
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function getCreatedHunts(currentUserId: string) {
    return prisma.hunt.findMany({
        where: {
            createdById: currentUserId,
        },
        select: huntOwnerDetailSelect,
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function getHuntById({ huntId, currentUserId }: GetHuntByIdInput) {
    const baseHunt = await prisma.hunt.findUnique({
        where: { id: huntId },
        select: {
            id: true,
            createdById: true,
            status: true,
            isDeleted: true,
        },
    });

    if (!baseHunt || baseHunt.isDeleted) {
        throw new HuntNotFoundError();
    }

    const isOwner = currentUserId === baseHunt.createdById;

    if (!isOwner && baseHunt.status !== HuntStatus.PUBLISHED) {
        throw new HuntNotFoundError();
    }

    const hunt = await prisma.hunt.findUnique({
        where: { id: huntId },
        select: isOwner ? huntOwnerDetailSelect : huntPublicDetailSelect,
    });

    if (!hunt) {
        throw new HuntNotFoundError();
    }

    return hunt;
}

export async function publishHunt({ huntId, currentUserId }: { huntId: string; currentUserId: string; }) {
    const hunt = await prisma.hunt.findUnique({
        where: { id: huntId },
        select: {
            id: true,
            createdById: true,
            status: true,
            isDeleted: true,
            visibility: true,
            accessCode: true,
            steps: {
                select: {
                    id: true,
                    orderIndex: true,
                },
                orderBy: {
                    orderIndex: "asc",
                },
            },
        },
    });

    if (!hunt) {
        throw new HuntPublishError("HUNT_NOT_FOUND");
    }

    if (hunt.createdById !== currentUserId) {
        throw new HuntPublishError("FORBIDDEN");
    }

    if (hunt.isDeleted) {
        throw new HuntPublishError("HUNT_DELETED");
    }

    if (hunt.status === HuntStatus.PUBLISHED) {
        throw new HuntPublishError("HUNT_ALREADY_PUBLISHED");
    }

    if (hunt.status !== HuntStatus.DRAFT) {
        throw new HuntPublishError("HUNT_NOT_DRAFT");
    }

    if (hunt.steps.length < 2) {
        throw new HuntPublishError("HUNT_NOT_ENOUGH_STEPS");
    }

    if (hunt.visibility === HuntVisibility.PRIVATE && !hunt.accessCode) {
        throw new HuntPublishError("HUNT_MISSING_ACCESS_CODE");
    }

    if (!hasSequentialStepOrder(hunt.steps)) {
        throw new HuntPublishError("HUNT_INVALID_STEP_ORDER");
    }

    return prisma.hunt.update({
        where: { id: huntId },
        data: {
            status: HuntStatus.PUBLISHED,
        },
        select: huntOwnerDetailSelect,
    });
}

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

export async function deleteHunt({ huntId, currentUserId, currentUserRole }: DeleteHuntInput) {
    const existingHunt = await prisma.hunt.findUnique({
        where: { id: huntId },
        select: {
            id: true,
            createdById: true,
            isDeleted: true,
        },
    });

    if (!existingHunt || existingHunt.isDeleted) {
        throw new HuntNotFoundError();
    }

    const isOwner = existingHunt.createdById === currentUserId;
    const isAdmin = currentUserRole === Role.ADMIN;

    if (!isOwner && !isAdmin) {
        throw new HuntForbiddenError();
    }

    await prisma.hunt.update({
        where: { id: huntId },
        data: { isDeleted: true },
    });
}

export function mapHuntError(error: unknown) {
    if (error instanceof HuntNotFoundError) {
        return apiError(
            "Chasse introuvable.",
            "HUNT_NOT_FOUND",
            404,
        );
    }

    if (error instanceof HuntForbiddenError) {
        return apiError(
            "Accès refusé à cette chasse.",
            "HUNT_FORBIDDEN",
            403,
        );
    }

    if (error instanceof HuntNotEditableError) {
        return apiError(
            "Impossible de modifier une chasse publiée.",
            "HUNT_NOT_EDITABLE",
            409,
        );
    }

    return null;
}