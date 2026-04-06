import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { listCluesForStep, StepForbiddenError, StepNotFoundError } from "@/lib/services/step.service";
import { NextResponse } from "next/server";

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await context.params;

        const clues = await listCluesForStep({
            stepId: id,
            currentUserId: currentUser.id,
        });

        return NextResponse.json({
            message: "Indices de l'étape récupérés avec succès.",
            data: {
                count: clues.length,
                items: clues,
            },
        });
    } catch (error) {
        console.error("GET /api/steps/[id]/clues error:", error);

        if (error instanceof AuthError) {
            return NextResponse.json(
                {
                    message: error.message,
                    error: error.code,
                },
                { status: error.status },
            );
        }

        if (error instanceof StepNotFoundError) {
            return NextResponse.json(
                {
                    message: "Étape introuvable.",
                    error: "STEP_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        if (error instanceof StepForbiddenError) {
            return NextResponse.json(
                {
                    message: "Vous n'avez pas accès à cette étape.",
                    error: "FORBIDDEN_RESOURCE",
                },
                { status: 403 },
            );
        }

        return NextResponse.json(
            {
                message: "Erreur lors de la récupération des indices.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}