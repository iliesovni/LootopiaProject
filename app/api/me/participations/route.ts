import { apiError, apiSuccess } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMyParticipations } from "@/lib/services/participation.service";
import { ParticipationStatus } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    let status: ParticipationStatus | undefined;

    if (statusParam) {
        if (!Object.values(ParticipationStatus).includes(statusParam as ParticipationStatus)) {
            return apiError(
                "Invalid status query parameter",
                "INVALID_STATUS",
                400,
            );
        }

        status = statusParam as ParticipationStatus;
    }

    try {
        const participations = await getMyParticipations(currentUser.id, {
            status,
        });

        return apiSuccess(
            "Participations retrieved successfully",
            participations,
        );
    } catch (error) {
        console.error(error);
        return apiError("Internal server error", "INTERNAL_SERVER_ERROR", 500);
    }
}