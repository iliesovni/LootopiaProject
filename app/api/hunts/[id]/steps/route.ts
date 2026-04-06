import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import {
    createStep,
    HuntNotFoundError,
    InvalidStepOrderError,
    StepForbiddenError,
    StepNotEditableError,
} from "@/lib/services/step.service";
import { createStepSchema } from "@/schemas/step";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function POST(
    request: NextRequest,
    { params }: RouteContext,
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await params;
        const body = await request.json();

        const validation = createStepSchema.safeParse({
            ...body,
            huntId: id,
        });

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const step = await createStep({
            huntId: id,
            currentUserId: currentUser.id,
            data: validation.data,
        });

        return NextResponse.json(
            {
                message: "Étape créée avec succès.",
                data: step,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("POST /api/hunts/[id]/steps error:", error);

        if (error instanceof AuthError) {
            return NextResponse.json(
                {
                    message: error.message,
                    error: error.code,
                },
                { status: error.status },
            );
        }

        if (error instanceof HuntNotFoundError) {
            return NextResponse.json(
                {
                    message: "Chasse introuvable.",
                    error: "HUNT_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        if (error instanceof StepForbiddenError) {
            return NextResponse.json(
                {
                    message: "Vous n'êtes pas autorisé à modifier cette chasse.",
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

        if (error instanceof InvalidStepOrderError) {
            return NextResponse.json(
                {
                    message: "Une étape avec ce numéro d'ordre existe déjà dans cette chasse.",
                    error: "INVALID_STEP_ORDER",
                },
                { status: 409 },
            );
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") {
                return NextResponse.json(
                    {
                        message: "La chasse indiquée n'existe pas.",
                        error: "HUNT_NOT_FOUND",
                    },
                    { status: 400 },
                );
            }
        }

        return NextResponse.json(
            {
                message: "Erreur lors de la création de l'étape.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}