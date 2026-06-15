import { apiError, apiSuccess } from "@/lib/api/responses";
import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { deleteClue, getClueById, mapClueError, updateClue } from "@/lib/services/clue.service";
import { updateClueSchema } from "@/schemas/clue";
import { NextRequest } from "next/server";

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
        const currentUser = await requireAuth();
        const { id } = await params;

        const clue = await getClueById({
            clueId: id,
            currentUserId: currentUser.id,
        });

        return apiSuccess("Indice récupéré.", clue);
    } catch (error) {
        console.error("GET /api/clues/[id] error:", error);

        const mapped = mapClueError(error);
        if (mapped) return mapped;

        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        return apiError(
            "Erreur lors de la récupération de l'indice.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await context.params;
        const body = await request.json();

        const validation = updateClueSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const updatedClue = await updateClue({
            clueId: id,
            currentUserId: currentUser.id,
            data: validation.data,
        });

        return apiSuccess("Indice mis à jour avec succès.", updatedClue);
    } catch (error) {
        console.error("PATCH /api/clues/[id] error:", error);

        const mapped = mapClueError(error);
        if (mapped) return mapped;

        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        return apiError(
            "Erreur lors de la mise à jour de l'indice.",
            "INTERNAL_SERVER_ERROR",
            500,
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

        await deleteClue({
            clueId: id,
            currentUserId: currentUser.id,
        });

        return apiSuccess("Indice supprimé avec succès.");
    } catch (error) {
        console.error("DELETE /api/clues/[id] error:", error);

        const mapped = mapClueError(error);
        if (mapped) return mapped;

        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        return apiError(
            "Erreur lors de la suppression de l'indice.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}