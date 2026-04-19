import { apiError, apiSuccess } from "@/lib/api/responses";
import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { createClue, mapClueError } from "@/lib/services/clue.service";
import { createClueSchema } from "@/schemas/clue";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requireAuth();
        const body = await request.json();

        const validation = createClueSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const createdClue = await createClue({
            currentUserId: currentUser.id,
            data: validation.data,
        });

        return apiSuccess("Indice créé avec succès.", createdClue, 201);
    } catch (error) {
        console.error("POST /api/clues error:", error);

        const mapped = mapClueError(error);
        if (mapped) return mapped;

        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        return apiError(
            "Erreur lors de la création de l'indice.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}