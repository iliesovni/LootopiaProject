import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import {
    ClueForbiddenError,
    ClueLimitReachedError,
    ClueNotEditableError,
    ClueOrderConflictError,
    createClue,
    listAccessibleClues,
    StepNotFoundError,
} from "@/lib/services/clue.service";
import { createClueSchema } from "@/schemas/clue";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const currentUser = await requireAuth();

        const clues = await listAccessibleClues({
            currentUserId: currentUser.id,
        });

        return NextResponse.json({
            message: "Indices récupérés avec succès.",
            data: {
                count: clues.length,
                items: clues,
            },
        });
    } catch (error) {
        console.error("GET /api/clues error:", error);

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
                message: "Erreur lors de la récupération des indices.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requireAuth();
        const body = await request.json();

        const validation = createClueSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        const createdClue = await createClue({
            currentUserId: currentUser.id,
            data: validation.data,
        });

        return NextResponse.json(
            {
                message: "Indice créé avec succès.",
                data: createdClue,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("POST /api/clues error:", error);

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

        if (error instanceof ClueForbiddenError) {
            return NextResponse.json(
                {
                    message: "Vous n'êtes pas autorisé à modifier cette étape.",
                    error: "FORBIDDEN_RESOURCE",
                },
                { status: 403 },
            );
        }

        if (error instanceof ClueNotEditableError) {
            return NextResponse.json(
                {
                    message: "Cette chasse est publiée et ne peut plus être modifiée.",
                    error: "HUNT_NOT_EDITABLE",
                },
                { status: 409 },
            );
        }

        if (error instanceof ClueOrderConflictError) {
            return NextResponse.json(
                {
                    message: "Un indice existe déjà à cet ordre pour cette étape.",
                    error: "CLUE_ORDER_CONFLICT",
                },
                { status: 409 },
            );
        }

        if (error instanceof ClueLimitReachedError) {
            return NextResponse.json(
                {
                    message: "Une étape ne peut pas contenir plus de 3 indices.",
                    error: "CLUE_LIMIT_REACHED",
                },
                { status: 409 },
            );
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2003"
        ) {
            return NextResponse.json(
                {
                    message: "La step fournie est invalide.",
                    error: "INVALID_STEP_ID",
                },
                { status: 400 },
            );
        }

        return NextResponse.json(
            {
                message: "Erreur lors de la création de l'indice.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}