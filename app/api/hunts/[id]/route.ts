import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthError, getOptionalCurrentUser } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { deleteHunt, getHuntById, mapHuntError, updateHunt } from "@/lib/services/hunt.service";
import { updateHuntSchema } from "@/schemas/hunt";
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

        const hunt = await getHuntById({
            huntId: id,
            currentUserId: currentUser?.id,
        });

        return NextResponse.json({
            message: "Chasse trouvée.",
            data: hunt,
        });
    } catch (error) {
        console.error("[HUNT_ERROR]", error);

        const mapped = mapHuntError(error);
        if (mapped) return mapped;

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

        const mapped = mapHuntError(error);
        if (mapped) return mapped;

        if (error instanceof AuthError) {
            return NextResponse.json(
                {
                    message: error.message,
                    error: error.code,
                },
                { status: error.status },
            );
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
            currentUserRole: currentUser.role,
        });

        return apiSuccess("Hunt deleted successfully");
    } catch (error) {
        console.error("DELETE /api/hunts/[id] error:", error);

        const mapped = mapHuntError(error);
        if (mapped) return mapped;

        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        return apiError(
            "Internal server error",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}