import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { createClue, mapClueError } from "@/lib/services/clue.service";
import { createClueSchema } from "@/schemas/clue";
import { NextRequest, NextResponse } from "next/server";

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

        const mapped = mapClueError(error);
        if (mapped) return mapped;

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
                message: "Erreur lors de la création de l'indice.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}