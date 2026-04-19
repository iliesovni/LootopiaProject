import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { listCluesForStep, mapStepError } from "@/lib/services/step.service";

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await context.params;

        const clues = await listCluesForStep({
            stepId: id,
            currentUserId: currentUser.id,
        });

        return apiSuccess("Indices de l'étape récupérés avec succès.", {
            count: clues.length,
            items: clues,
        });
    } catch (error) {
        console.error("GET /api/steps/[id]/clues error:", error);

        const mapped = mapStepError(error);
        if (mapped) return mapped;

        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        return apiError(
            "Erreur lors de la récupération des indices.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}