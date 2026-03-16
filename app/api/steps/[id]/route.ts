import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateStepSchema } from "@/schemas/step";
import { z, ZodError } from "zod";
import {Prisma} from "@prisma/client";

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
            include: {
                hunt: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                    },
                },
                clues: {
                    orderBy: {
                        orderIndex: "asc",
                    },
                },
            },
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
    { params }: RouteContext
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const data = updateStepSchema.parse(body);

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

        const updatedStep = await prisma.step.update({
            where: { id },
            data,
            include: {
                clues: {
                    orderBy: {
                        orderIndex: "asc",
                    },
                },
            },
        });

        return NextResponse.json({
            ok: true,
            message: "Étape mise à jour avec succès.",
            step: updatedStep,
        });
    } catch (error) {
        console.error("PATCH /api/steps/[id] error:", error);

        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Données invalides.",
                    errors: z.flattenError(error),
                },
                { status: 400 }
            );
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return NextResponse.json(
                    {
                        ok: false,
                        message: "Une étape avec ce numéro d'ordre existe déjà dans cette chasse.",
                    },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la mise à jour de l'étape.",
            },
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