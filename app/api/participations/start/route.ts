import { apiError, apiSuccess } from "@/lib/api/responses";
import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { mapParticipationError, startParticipation } from "@/lib/services/participation.service";
import { startParticipationSchema } from "@/schemas/participation";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();

        const body = await request.json();
        const validation = startParticipationSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const participation = await startParticipation({
            userId: user.id,
            huntId: validation.data.huntId,
            accessCode: validation.data.accessCode ?? null,
        });

        return apiSuccess(
            "Participation démarrée avec succès.",
            participation,
            201,
        );
    } catch (error) {
        console.error("POST /api/participations/start error:", error);

        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        return (
            mapParticipationError(error) ??
            apiError(
                "Erreur lors du démarrage de la participation.",
                "INTERNAL_SERVER_ERROR",
                500,
            )
        );
    }
}