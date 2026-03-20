import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateClueSchema } from "@/schemas/clue";
import { z, ZodError } from "zod";
import {Prisma} from "@prisma/client";
import { clueInclude } from "@/lib/prisma-includes";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(
    _request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { id } = await params;

        const clue = await prisma.clue.findUnique({
            where: { id },
            include: clueInclude,
        });

        if (!clue) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Indice introuvable.",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            clue,
        });
    } catch (error) {
        console.error("GET /api/clues/[id] error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la récupération de l'indice.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        const validation = updateClueSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Payload invalide.",
                    details: validation.error.issues,
                },
                { status: 400 }
            );
        }

        const updatedClue = await prisma.$transaction(async (tx) => {
            const existingClue = await tx.clue.findUnique({
                where: { id },
                select: {
                    id: true,
                    stepId: true,
                    orderIndex: true,
                },
            });

            if (!existingClue) {
                throw new Error("CLUE_NOT_FOUND");
            }

            const { orderIndex, ...otherUpdates } = validation.data;

            if (orderIndex === undefined || orderIndex === existingClue.orderIndex) {
                return await tx.clue.update({
                    where: { id },
                    data: otherUpdates,
                    include: clueInclude,
                });
            }

            const cluesCount = await tx.clue.count({
                where: { stepId: existingClue.stepId },
            });

            const targetOrderIndex = Math.min(
                Math.max(orderIndex, 1),
                cluesCount
            );

            await tx.clue.update({
                where: { id },
                data: {
                    orderIndex: 0,
                },
            });

            if (targetOrderIndex < existingClue.orderIndex) {
                await tx.clue.updateMany({
                    where: {
                        stepId: existingClue.stepId,
                        orderIndex: {
                            gte: targetOrderIndex,
                            lt: existingClue.orderIndex,
                        },
                    },
                    data: {
                        orderIndex: {
                            increment: 1,
                        },
                    },
                });
            }

            if (targetOrderIndex > existingClue.orderIndex) {
                await tx.clue.updateMany({
                    where: {
                        stepId: existingClue.stepId,
                        orderIndex: {
                            gt: existingClue.orderIndex,
                            lte: targetOrderIndex,
                        },
                    },
                    data: {
                        orderIndex: {
                            decrement: 1,
                        },
                    },
                });
            }

            return await tx.clue.update({
                where: { id },
                data: {
                    ...otherUpdates,
                    orderIndex: targetOrderIndex,
                },
                include: clueInclude,
            });
        });

        return NextResponse.json({
            message: "Indice mis à jour avec succès.",
            data: updatedClue,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "CLUE_NOT_FOUND") {
            return NextResponse.json(
                { error: "Indice introuvable." },
                { status: 404 }
            );
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return NextResponse.json(
                { error: "Indice introuvable." },
                { status: 404 }
            );
        }

        console.error("[UPDATE_CLUE_ERROR]", error);

        return NextResponse.json(
            { error: "Erreur serveur." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { id } = await params;

        const existingClue = await prisma.clue.findUnique({
            where: { id },
        });

        if (!existingClue) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Indice introuvable.",
                },
                { status: 404 }
            );
        }

        await prisma.clue.delete({
            where: { id },
        });

        return NextResponse.json({
            ok: true,
            message: "Indice supprimé avec succès.",
        });
    } catch (error) {
        console.error("DELETE /api/clues/[id] error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la suppression de l'indice.",
            },
            { status: 500 }
        );
    }
}