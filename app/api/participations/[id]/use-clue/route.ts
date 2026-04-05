import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { mapParticipationError, useClue } from "@/lib/services/participation.service";
import { useClueSchema } from "@/schemas/participation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const user = await requireAuth();
        const { id } = await context.params;
        const body = await request.json();

        const validation = useClueSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const result = await useClue({
            participationId: id,
            userId: user.id,
            stepId: validation.data.stepId,
        });

        return NextResponse.json({
            message: "Indice utilisé avec succès.",
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

        console.error("[USE_CLUE_ERROR]", error);

        return NextResponse.json(
            {
                message: "Erreur serveur.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}