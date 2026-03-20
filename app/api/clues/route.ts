import {NextRequest, NextResponse} from "next/server";
import { prisma } from "@/lib/prisma";
import { clueInclude } from "@/lib/prisma-includes";
import {createClueSchema, updateClueSchema} from "@/schemas/clue";
import {Prisma} from "@prisma/client";

export async function GET() {
    try {
        const clues = await prisma.clue.findMany({
            include: clueInclude,
            orderBy: [{ stepId: "asc" }, { orderIndex: "asc" }],
        });

        return NextResponse.json({
            ok: true,
            count: clues.length,
            clues,
        });
    } catch (error) {
        console.error("GET /api/clues error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la récupération des indices.",
            },
            { status: 500 }
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
                    error: "Payload invalide.",
                    details: validation.error.issues,
                },
                { status: 400 }
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
                    throw new Error("ORDER_INDEX_ALREADY_EXISTS");
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
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "STEP_NOT_FOUND") {
                return NextResponse.json(
                    { error: "Step introuvable." },
                    { status: 404 }
                );
            }

            if (error.message === "ORDER_INDEX_ALREADY_EXISTS") {
                return NextResponse.json(
                    { error: "Un indice existe déjà à cet ordre pour cette étape." },
                    { status: 409 }
                );
            }
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2003"
        ) {
            return NextResponse.json(
                { error: "La step fournie est invalide." },
                { status: 400 }
            );
        }

        console.error("[CREATE_CLUE_ERROR]", error);

        return NextResponse.json(
            { error: "Erreur serveur." },
            { status: 500 }
        );
    }
}