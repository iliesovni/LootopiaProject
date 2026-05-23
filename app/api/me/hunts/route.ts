import { apiError, apiSuccess } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCreatedHunts } from "@/lib/services/hunt.service";

export async function GET() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    try {
        const hunts = await getCreatedHunts(currentUser.id);
        return apiSuccess("Created hunts retrieved successfully", hunts);
    } catch (error) {
        console.error(error);
        return apiError("Internal server error", "INTERNAL_SERVER_ERROR", 500);
    }
}