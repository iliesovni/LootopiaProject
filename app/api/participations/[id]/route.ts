import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { getParticipationById, mapParticipationError } from "@/lib/services/participation.service";
import { NextResponse } from "next/server";

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await context.params;

        const participation = await getParticipationById({
            participationId: id,
            userId: currentUser.id,
        });

        return NextResponse.json({
            message: "Participation récupérée avec succès.",
            data: participation,
        });
    } catch (error) {
        console.error("[GET_PARTICIPATION_ERROR]", error);

        const mapped = mapParticipationError(error);
        if (mapped) return mapped;
        
        if (error instanceof AuthError) {
            return NextResponse.json(
                {
                    message: error.message,
                    error: error.code,
                },
                { status: error.status },
            );
        }

        return NextResponse.json(
            {
                message: "Erreur serveur.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}