import { apiError, apiSuccess } from "@/lib/api/responses";
import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { applyClue, mapParticipationError } from "@/lib/services/participation.service";
import { useClueSchema } from "@/schemas/participation";
import { NextRequest } from "next/server";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const user = await requireAuth();
        const { id } = await context.params;
        const body = await request.json();

        const validation = useClueSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const result = await applyClue({
            participationId: id,
            userId: user.id,
            stepId: validation.data.stepId,
        });

        return apiSuccess("Indice utilisé avec succès.", result);
    } catch (error) {
        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        const mappedError = mapParticipationError(error);
        if (mappedError) {
            return mappedError;
        }

        console.error("[USE_CLUE_ERROR]", error);

        return apiError(
            "Erreur serveur.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}