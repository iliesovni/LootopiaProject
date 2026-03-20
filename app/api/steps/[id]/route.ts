import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateStepSchema } from "@/schemas/step";
import { z, ZodError } from "zod";
import {Prisma} from "@prisma/client";
import { stepInclude } from "@/lib/prisma-includes";

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

        const step = await prisma.step.findUnique({
            where: { id },
            include: stepInclude,
        });

        if (!step) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Étape introuvable.",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            step,
        });
    } catch (error) {
        console.error("GET /api/steps/[id] error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la récupération de l'étape.",
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

        const validation = updateStepSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Payload invalide.",
                    details: validation.error.issues,
                },
                { status: 400 }
            );
        }

        const updatedStep = await prisma.$transaction(async (tx) => {
            const existingStep = await tx.step.findUnique({
                where: { id },
                select: {
                    id: true,
                    huntId: true,
                    orderIndex: true,
                },
            });

            if (!existingStep) {
                throw new Error("STEP_NOT_FOUND");
            }

            const { orderIndex, ...otherUpdates } = validation.data;

            // Pas de déplacement d'ordre : update simple
            if (orderIndex === undefined || orderIndex === existingStep.orderIndex) {
                return tx.step.update({
                    where: { id },
                    data: otherUpdates,
                    include: stepInclude,
                });
            }

            // On garde une indexation 1-based cohérente avec les données existantes
            const stepsCount = await tx.step.count({
                where: { huntId: existingStep.huntId },
            });

            const targetOrderIndex = Math.min(
                Math.max(orderIndex, 1),
                stepsCount
            );

            // On déplace temporairement la step hors de la plage pour éviter un conflit unique
            await tx.step.update({
                where: { id },
                data: {
                    orderIndex: 0,
                },
            });

            // Déplacement vers le haut : les steps intermédiaires descendent
            if (targetOrderIndex < existingStep.orderIndex) {
                await tx.step.updateMany({
                    where: {
                        huntId: existingStep.huntId,
                        orderIndex: {
                            gte: targetOrderIndex,
                            lt: existingStep.orderIndex,
                        },
                    },
                    data: {
                        orderIndex: {
                            increment: 1,
                        },
                    },
                });
            }

            // Déplacement vers le bas : les steps intermédiaires remontent
            if (targetOrderIndex > existingStep.orderIndex) {
                await tx.step.updateMany({
                    where: {
                        huntId: existingStep.huntId,
                        orderIndex: {
                            gt: existingStep.orderIndex,
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

            return tx.step.update({
                where: { id },
                data: {
                    ...otherUpdates,
                    orderIndex: targetOrderIndex,
                },
                include: stepInclude,
            });
        });

        return NextResponse.json({
            message: "Étape mise à jour avec succès.",
            data: updatedStep,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "STEP_NOT_FOUND") {
            return NextResponse.json(
                { error: "Étape introuvable." },
                { status: 404 }
            );
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return NextResponse.json(
                { error: "Étape introuvable." },
                { status: 404 }
            );
        }

        console.error("[UPDATE_STEP_ERROR]", error);

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

        const existingStep = await prisma.step.findUnique({
            where: { id },
        });

        if (!existingStep) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Étape introuvable.",
                },
                { status: 404 }
            );
        }

        await prisma.step.delete({
            where: { id },
        });

        return NextResponse.json({
            ok: true,
            message: "Étape supprimée avec succès.",
        });
    } catch (error) {
        console.error("DELETE /api/steps/[id] error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la suppression de l'étape.",
            },
            { status: 500 }
        );
    }
}