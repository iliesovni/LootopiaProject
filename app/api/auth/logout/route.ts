import { apiError, apiSuccess } from "@/lib/api/responses";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth/cookies";

export async function POST() {
    try {
        const response = apiSuccess("Déconnexion réussie.");

        response.cookies.set(AUTH_COOKIE_NAME, "", {
            ...authCookieOptions,
            maxAge: 0,
        });

        return response;
    } catch (error) {
        console.error("POST /api/auth/logout error:", error);

        return apiError(
            "Erreur lors de la déconnexion.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}