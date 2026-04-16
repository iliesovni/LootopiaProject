import { apiError, apiSuccess } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { HuntPublishError, publishHunt } from "@/lib/services/hunt.service";
import { NextRequest } from "next/server";

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;

    try {
        const hunt = await publishHunt({
            huntId: id,
            currentUserId: currentUser.id,
        });

        return apiSuccess("Hunt published successfully", hunt, 200);
    } catch (error) {
        if (error instanceof HuntPublishError) {
            switch (error.code) {
                case "HUNT_NOT_FOUND":
                    return apiError("Hunt not found", error.code, 404);

                case "FORBIDDEN":
                    return apiError("Forbidden", error.code, 403);

                case "HUNT_DELETED":
                case "HUNT_ALREADY_PUBLISHED":
                case "HUNT_NOT_DRAFT":
                case "HUNT_NOT_ENOUGH_STEPS":
                case "HUNT_MISSING_ACCESS_CODE":
                case "HUNT_INVALID_STEP_ORDER":
                    return apiError("Unable to publish hunt", error.code, 400);
            }
        }

        console.error(error);
        return apiError("Internal server error", "INTERNAL_SERVER_ERROR", 500);
    }
}