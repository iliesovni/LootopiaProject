import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import {
    deleteStep,
    getStepById,
    StepForbiddenError,
    StepNotEditableError,
    StepNotFoundError,
    updateStep,
} from "@/lib/services/step.service";
import { updateStepSchema } from "@/schemas/step";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(
    _request: NextRequest,
    { params }: RouteContext,
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await params;

        const step = await getStepById({
            stepId: id,
            currentUserId: currentUser.id,
        });

        return NextResponse.json({
            message: "Étape récupérée.",
            data: step,
        });
    } catch (error) {
        console.error("GET /api/steps/[id] error:", error);

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
                message: "Erreur lors de la récupération de l'étape.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await context.params;
        const body = await request.json();

        const validation = updateStepSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const updatedStep = await updateStep({
            stepId: id,
            currentUserId: currentUser.id,
            data: validation.data,
        });

        return NextResponse.json({
            message: "Étape mise à jour avec succès.",
            data: updatedStep,
        });
    } catch (error) {
        console.error("PATCH /api/steps/[id] error:", error);

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
                    message: "Vous n'êtes pas autorisé à modifier cette étape.",
                    error: "FORBIDDEN_RESOURCE",
                },
                { status: 403 },
            );
        }

        if (error instanceof StepNotEditableError) {
            return NextResponse.json(
                {
                    message: "Cette chasse est publiée et ne peut plus être modifiée.",
                    error: "HUNT_NOT_EDITABLE",
                },
                { status: 409 },
            );
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return NextResponse.json(
                {
                    message: "Étape introuvable.",
                    error: "STEP_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            {
                message: "Erreur lors de la mise à jour de l'étape.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: RouteContext,
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await params;

        await deleteStep({
            stepId: id,
            currentUserId: currentUser.id,
        });

        return NextResponse.json({
            message: "Étape supprimée avec succès.",
        });
    } catch (error) {
        console.error("DELETE /api/steps/[id] error:", error);

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
                    message: "Vous n'êtes pas autorisé à supprimer cette étape.",
                    error: "FORBIDDEN_RESOURCE",
                },
                { status: 403 },
            );
        }

        if (error instanceof StepNotEditableError) {
            return NextResponse.json(
                {
                    message: "Cette chasse est publiée et ne peut plus être modifiée.",
                    error: "HUNT_NOT_EDITABLE",
                },
                { status: 409 },
            );
        }

        return NextResponse.json(
            {
                message: "Erreur lors de la suppression de l'étape.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}