import { apiError } from "@/lib/api/responses";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth/cookies";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const response = NextResponse.json(
            {
                message: "Déconnexion réussie.",
            },
            { status: 200 },
        );

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