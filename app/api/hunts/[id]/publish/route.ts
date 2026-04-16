import { getCurrentUser } from "@/lib/auth/current-user";
import { HuntPublishError, publishHunt } from "@/lib/services/hunt.service";
import { NextResponse } from "next/server";

export async function POST(
    _req: Request,
    { params }: { params: { id: string } },
) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 },
        );
    }

    try {
        const hunt = await publishHunt({
            huntId: params.id,
            currentUserId: currentUser.id,
        });

        return NextResponse.json(hunt, { status: 200 });
    } catch (error) {
        if (error instanceof HuntPublishError) {
            switch (error.code) {
                case "HUNT_NOT_FOUND":
                    return NextResponse.json(
                        { message: "Hunt not found" },
                        { status: 404 },
                    );

                case "FORBIDDEN":
                    return NextResponse.json(
                        { message: "Forbidden" },
                        { status: 403 },
                    );

                case "HUNT_DELETED":
                case "HUNT_ALREADY_PUBLISHED":
                case "HUNT_NOT_DRAFT":
                case "HUNT_NOT_ENOUGH_STEPS":
                case "HUNT_MISSING_ACCESS_CODE":
                case "HUNT_INVALID_STEP_ORDER":
                    return NextResponse.json(
                        { message: error.code },
                        { status: 400 },
                    );
            }
        }

        console.error(error);

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}