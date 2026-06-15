import { apiError, apiSuccess } from "@/lib/api/responses";
import { apiValidationError } from "@/lib/api/validation";
import { AuthServiceError, registerUser } from "@/lib/services/auth.service";
import { registerSchema } from "@/schemas/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const user = await registerUser(validation.data);

        return apiSuccess("Utilisateur créé avec succès.", user, 201);
    } catch (error) {
        console.error("POST /api/auth/register error:", error);

        if (error instanceof AuthServiceError) {
            return apiError(error.message, error.code, error.status);
        }

        return apiError(
            "Erreur lors de la création du compte.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}