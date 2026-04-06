import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { listAccessibleSteps } from "@/lib/services/step.service";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const currentUser = await requireAuth();

        const steps = await listAccessibleSteps({
            currentUserId: currentUser.id,
        });

        return NextResponse.json({
            message: "Les étapes ont été récupérées.",
            data: {
                count: steps.length,
                items: steps,
            },
        });
    } catch (error) {
        console.error("GET /api/steps error:", error);

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
                message: "Erreur lors de la récupération des étapes.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}