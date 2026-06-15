import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthError, getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
    try {
        const user = await getCurrentUser();

        return apiSuccess("Utilisateur authentifié.", user, 200);
    } catch (error) {
        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        console.error("GET /api/auth/me — erreur interne:", {
            error,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });

        return apiError(
            "Erreur lors de la récupération de l'utilisateur courant.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}