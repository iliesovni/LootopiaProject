import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { mapParticipationError, startParticipation } from "@/lib/services/participation.service";
import { startParticipationSchema } from "@/schemas/participation";
import { NextRequest, NextResponse } from "next/server";

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
        });

        return NextResponse.json(
            {
                message: "Participation démarrée avec succès.",
                data: participation,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("POST /api/participations/start error:", error);

        if (error instanceof AuthError) {
            return NextResponse.json(
                {
                    message: error.message,
                    error: error.code,
                },
                { status: error.status },
            );
        }

        return (
            mapParticipationError(error) ??
            NextResponse.json(
                {
                    message: "Erreur lors du démarrage de la participation.",
                    error: "INTERNAL_SERVER_ERROR",
                },
                { status: 500 },
            )
        );
    }
}