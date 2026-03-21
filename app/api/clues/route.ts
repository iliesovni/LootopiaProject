import { clueInclude } from "@/lib/db/includes/clue.include";
import { prisma } from "@/lib/db/prisma";
import { createClueSchema } from "@/schemas/clue";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const clues = await prisma.clue.findMany({
            include: clueInclude,
            orderBy: [{ stepId: "asc" }, { orderIndex: "asc" }],
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
        const body = await request.json();

        const validation = createClueSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    message: "Payload invalide.",
                    error: "VALIDATION_ERROR",
                    data: {
                        details: validation.error.issues,
                    },
                },
                { status: 400 },
            );
        }

        const { stepId, content, penaltyPoints, orderIndex } = validation.data;

        const createdClue = await prisma.$transaction(async (tx) => {
            const step = await tx.step.findUnique({
                where: { id: stepId },
                select: { id: true },
            });

            if (!step) {
                throw new Error("STEP_NOT_FOUND");
            }

            let finalOrderIndex = orderIndex;

            if (finalOrderIndex === undefined) {
                const lastClue = await tx.clue.findFirst({
                    where: { stepId },
                    orderBy: { orderIndex: "desc" },
                    select: { orderIndex: true },
                });

                finalOrderIndex = lastClue ? lastClue.orderIndex + 1 : 1;
            } else {
                const existingClueAtSameIndex = await tx.clue.findFirst({
                    where: {
                        stepId,
                        orderIndex: finalOrderIndex,
                    },
                    select: { id: true },
                });

                if (existingClueAtSameIndex) {
                    throw new Error("CLUE_ORDER_CONFLICT");
                }
            }

            return tx.clue.create({
                data: {
                    stepId,
                    content,
                    penaltyPoints,
                    orderIndex: finalOrderIndex,
                },
                include: clueInclude,
            });
        });

        return NextResponse.json(
            {
                message: "Indice créé avec succès.",
                data: createdClue,
            },
            { status: 201 },
        );
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "STEP_NOT_FOUND") {
                return NextResponse.json(
                    {
                        message: "Step introuvable.",
                        error: "STEP_NOT_FOUND",
                    },
                    { status: 404 },
                );
            }

            if (error.message === "CLUE_ORDER_CONFLICT") {
                return NextResponse.json(
                    {
                        message: "Un indice existe déjà à cet ordre pour cette étape.",
                        error: "CLUE_ORDER_CONFLICT",
                    },
                    { status: 409 },
                );
            }
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

        console.error("[CREATE_CLUE_ERROR]", error);

        return NextResponse.json(
            {
                message: "Erreur lors de la création de l'indice.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}