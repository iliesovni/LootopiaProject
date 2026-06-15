import { apiError, apiSuccess } from "@/lib/api/responses";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { abandonParticipation, mapParticipationError } from "@/lib/services/participation.service";
import { NextRequest } from "next/server";

export async function POST(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const user = await requireAuth();
        const { id } = await context.params;

        const updatedParticipation = await abandonParticipation({
            participationId: id,
            userId: user.id,
        });

        return apiSuccess(
            "Participation abandonnée avec succès.",
            updatedParticipation,
        );
    } catch (error) {
        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        const mappedError = mapParticipationError(error);
        if (mappedError) {
            return mappedError;
        }

        console.error("[ABANDON_PARTICIPATION_ERROR]", error);

        return apiError(
            "Erreur serveur.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}