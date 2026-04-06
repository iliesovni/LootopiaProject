import { AuthError, getOptionalCurrentUser } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { huntInclude } from "@/lib/db/includes/hunt.include";
import { prisma } from "@/lib/db/prisma";
import {
    deleteHunt,
    HuntForbiddenError,
    HuntNotEditableError,
    HuntNotFoundError,
    updateHunt,
} from "@/lib/services/hunt.service";
import { updateHuntSchema } from "@/schemas/hunt";
import { HuntStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(
    _request: NextRequest,
    { params }: RouteContext,
) {
    try {
        const { id } = await params;
        const currentUser = await getOptionalCurrentUser();

        const hunt = await prisma.hunt.findUnique({
            where: {
                id,
            },
            include: huntInclude,
        });

        if (!hunt) {
            return NextResponse.json(
                {
                    message: "Chasse introuvable.",
                    error: "HUNT_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        if (hunt.isDeleted) {
            return NextResponse.json(
                {
                    message: "Chasse introuvable.",
                    error: "HUNT_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        const isOwner = currentUser?.id === hunt.createdById;

        if (!isOwner && hunt.status !== HuntStatus.PUBLISHED) {
            return NextResponse.json(
                {
                    message: "Chasse introuvable.",
                    error: "HUNT_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        return NextResponse.json({
            message: "Chasse trouvée.",
            data: hunt,
        });
    } catch (error) {
        console.error("GET /api/hunts/[id] error:", error);

        return NextResponse.json(
            {
                message: "Erreur lors de la récupération de la chasse.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: RouteContext,
) {
    try {
        const currentUser = await requireAuth();

        const { id } = await params;
        const body = await request.json();

        const validation = updateHuntSchema.safeParse(body);

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

        const updatedHunt = await updateHunt({
            huntId: id,
            currentUserId: currentUser.id,
            data: validation.data,
        });

        return NextResponse.json({
            message: "Chasse mise à jour avec succès.",
            data: updatedHunt,
        });
    } catch (error) {
        console.error("PATCH /api/hunts/[id] error:", error);

        if (error instanceof AuthError) {
            return NextResponse.json(
                {
                    message: error.message,
                    error: error.code,
                },
                { status: error.status },
            );
        }

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
                    message: "Vous n'êtes pas autorisé à modifier cette chasse.",
                    error: "FORBIDDEN_RESOURCE",
                },
                { status: 403 },
            );
        }

        if (error instanceof HuntNotEditableError) {
            return NextResponse.json(
                {
                    message: "Cette chasse est publiée et ne peut plus être modifiée.",
                    error: "HUNT_NOT_EDITABLE",
                },
                { status: 409 },
            );
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") {
                return NextResponse.json(
                    {
                        message: "Une relation fournie est invalide.",
                        error: "INVALID_REFERENCE_ID",
                    },
                    { status: 400 },
                );
            }

            if (error.code === "P2025") {
                return NextResponse.json(
                    {
                        message: "Chasse introuvable.",
                        error: "HUNT_NOT_FOUND",
                    },
                    { status: 404 },
                );
            }
        }

        return NextResponse.json(
            {
                message: "Erreur lors de la mise à jour de la chasse.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: RouteContext,
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await params;

        await deleteHunt({
            huntId: id,
            currentUserId: currentUser.id,
        });

        return NextResponse.json({
            message: "Chasse supprimée avec succès.",
        });
    } catch (error) {
        console.error("DELETE /api/hunts/[id] error:", error);

        if (error instanceof AuthError) {
            return NextResponse.json(
                {
                    message: error.message,
                    error: error.code,
                },
                { status: error.status },
            );
        }

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
                    message: "Vous n'êtes pas autorisé à supprimer cette chasse.",
                    error: "FORBIDDEN_RESOURCE",
                },
                { status: 403 },
            );
        }

        return NextResponse.json(
            {
                message: "Erreur lors de la suppression de la chasse.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}