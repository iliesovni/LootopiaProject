import { clueInclude } from "@/lib/db/includes/clue.include";
import { prisma } from "@/lib/db/prisma";
import { updateClueSchema } from "@/schemas/clue";
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
        const { id } = await params;

        const clue = await prisma.clue.findUnique({
            where: { id },
            include: clueInclude,
        });

        if (!clue) {
            return NextResponse.json(
                {
                    message: "Indice introuvable.",
                    error: "CLUE_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        return NextResponse.json({
            message: "Indice récupéré",
            data: clue,
        });
    } catch (error) {
        console.error("GET /api/clues/[id] error:", error);

        return NextResponse.json(
            {
                message: "Erreur lors de la récupération de l'indice.",
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
        const { id } = await context.params;
        const body = await request.json();

        const validation = updateClueSchema.safeParse(body);

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
                return tx.clue.update({
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
                cluesCount,
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

            return tx.clue.update({
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
                {
                    message: "Indice introuvable.",
                    error: "CLUE_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return NextResponse.json(
                {
                    message: "Indice introuvable.",
                    error: "CLUE_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        console.error("[UPDATE_CLUE_ERROR]", error);

        return NextResponse.json(
            {
                message: "Erreur lors de la mise à jour de l'indice.",
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
        const { id } = await params;

        const existingClue = await prisma.clue.findUnique({
            where: { id },
            select: {
                id: true,
                stepId: true,
                orderIndex: true,
            },
        });

        if (!existingClue) {
            return NextResponse.json(
                {
                    message: "Indice introuvable.",
                    error: "CLUE_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        await prisma.$transaction(async (tx) => {
            await tx.clue.delete({
                where: { id },
            });

            await tx.clue.updateMany({
                where: {
                    stepId: existingClue.stepId,
                    orderIndex: {
                        gt: existingClue.orderIndex,
                    },
                },
                data: {
                    orderIndex: {
                        decrement: 1,
                    },
                },
            });
        });

        return NextResponse.json({
            message: "Indice supprimé avec succès.",
        });
    } catch (error) {
        console.error("DELETE /api/clues/[id] error:", error);

        return NextResponse.json(
            {
                message: "Erreur lors de la suppression de l'indice.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}