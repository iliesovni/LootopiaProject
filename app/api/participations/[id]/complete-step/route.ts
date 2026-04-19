import { apiError, apiSuccess } from "@/lib/api/responses";
import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { completeStep, mapParticipationError } from "@/lib/services/participation.service";
import { completeStepSchema } from "@/schemas/participation";
import { NextRequest } from "next/server";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const logContext: {
        participationId: string | null;
        stepId: string | null;
        userId: string | null;
    } = {
        participationId: null,
        stepId: null,
        userId: null,
    };

    try {
        const user = await requireAuth();
        logContext.userId = user.id;

        const { id } = await context.params;
        logContext.participationId = id;

        const body = await request.json();

        const validation = completeStepSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const { stepId } = validation.data;
        logContext.stepId = stepId;

        const result = await completeStep({
            participationId: id,
            userId: user.id,
            stepId,
        });

        return apiSuccess("Étape complétée avec succès.", result);
    } catch (error) {
        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        const mappedError = mapParticipationError(error);
        if (mappedError) {
            return mappedError;
        }

        console.error("[COMPLETE_STEP_ERROR]", {
            ...logContext,
            error,
        });

        return apiError(
            "Erreur serveur.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}