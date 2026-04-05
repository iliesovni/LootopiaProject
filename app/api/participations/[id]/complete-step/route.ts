import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { completeStep, mapParticipationError } from "@/lib/services/participation.service";
import { completeStepSchema } from "@/schemas/participation";
import { NextRequest, NextResponse } from "next/server";

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

        return NextResponse.json({
            message: "Étape complétée avec succès.",
            data: result,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                {
                    message: error.message,
                    error: error.code,
                },
                { status: error.status },
            );
        }

        const mappedError = mapParticipationError(error);
        if (mappedError) {
            return mappedError;
        }

        console.error("[COMPLETE_STEP_ERROR]", {
            ...logContext,
            error,
        });

        return NextResponse.json(
            {
                message: "Erreur serveur.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}