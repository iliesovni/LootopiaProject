import { apiError } from "@/lib/api/responses";
import { apiValidationError } from "@/lib/api/validation";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth/cookies";
import { AuthServiceError, loginUser } from "@/lib/services/auth.service";
import { loginSchema } from "@/schemas/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const { user, token } = await loginUser(validation.data);

        const response = NextResponse.json(
            {
                message: "Connexion réussie.",
                data: user,
            },
            { status: 200 },
        );

        response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);

        return response;
    } catch (error) {
        console.error("POST /api/auth/login error:", error);

        if (error instanceof AuthServiceError) {
            return apiError(error.message, error.code, error.status);
        }

        return apiError(
            "Erreur lors de la connexion.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}