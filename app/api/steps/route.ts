import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { listAccessibleSteps } from "@/lib/services/step.service";

export async function GET() {
    try {
        const currentUser = await requireAuth();

        const steps = await listAccessibleSteps({
            currentUserId: currentUser.id,
        });

        return apiSuccess("Les étapes ont été récupérées.", {
            count: steps.length,
            items: steps,
        });
    } catch (error) {
        console.error("GET /api/steps error:", error);

        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        return apiError(
            "Erreur lors de la récupération des étapes.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}