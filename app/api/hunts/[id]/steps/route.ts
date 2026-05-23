import { apiError, apiSuccess } from "@/lib/api/responses";
import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { createStep, mapStepError } from "@/lib/services/step.service";
import { createStepSchema } from "@/schemas/step";
import { NextRequest } from "next/server";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function POST(
    request: NextRequest,
    { params }: RouteContext,
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await params;
        const body = await request.json();

        const validation = createStepSchema.safeParse({
            ...body,
            huntId: id,
        });

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const step = await createStep({
            huntId: id,
            currentUserId: currentUser.id,
            data: validation.data,
        });

        return apiSuccess("Étape créée avec succès.", step, 201);
    } catch (error) {
        console.error("POST /api/hunts/[id]/steps error:", error);

        const mapped = mapStepError(error);
        if (mapped) return mapped;

        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        return apiError(
            "Erreur lors de la création de l'étape.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}