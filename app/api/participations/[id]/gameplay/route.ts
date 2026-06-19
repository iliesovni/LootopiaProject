import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { getParticipationGameplay, mapParticipationError } from "@/lib/services/participation.service";

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await context.params;

        const gameplay = await getParticipationGameplay({
            participationId: id,
            userId: currentUser.id,
        });

        return apiSuccess("Partie récupérée avec succès.", gameplay);
    } catch (error) {
        console.error("[GET_PARTICIPATION_GAMEPLAY_ERROR]", error);

        const mapped = mapParticipationError(error);
        if (mapped) return mapped;

        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        return apiError(
            "Erreur serveur.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}
