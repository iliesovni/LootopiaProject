import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { finishParticipation, mapParticipationError } from "@/lib/services/participation.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const user = await requireAuth();
        const { id } = await context.params;

        const updatedParticipation = await finishParticipation({
            participationId: id,
            userId: user.id,
        });

        return NextResponse.json({
            message: "Participation terminée avec succès.",
            data: updatedParticipation,
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

        console.error("[FINISH_PARTICIPATION_ERROR]", error);

        return NextResponse.json(
            {
                message: "Erreur serveur.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}