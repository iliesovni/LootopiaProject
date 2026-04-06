import { huntOwnerDetailSelect, huntPublicDetailSelect } from "@/lib/db/includes/hunt.include";
import { prisma } from "@/lib/db/prisma";
import { HuntStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

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

type GetHuntByIdInput = {
    huntId: string;
    currentUserId?: string;
};

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

export function mapHuntError(error: unknown) {
    if (error instanceof HuntNotFoundError) {
        return NextResponse.json(
            {
                message: "Chasse introuvable.",
                error: "HUNT_NOT_FOUND",
            },
            { status: 404 },
        );
    }

    if (error instanceof HuntForbiddenError) {
        return NextResponse.json(
            {
                message: "Accès refusé à cette chasse.",
                error: "HUNT_FORBIDDEN",
            },
            { status: 403 },
        );
    }

    if (error instanceof HuntNotEditableError) {
        return NextResponse.json(
            {
                message: "Impossible de modifier une chasse publiée.",
                error: "HUNT_NOT_EDITABLE",
            },
            { status: 409 },
        );
    }

    return null;
}