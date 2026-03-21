import { prisma } from "@/lib/db/prisma";
import { createStepSchema } from "@/schemas/step";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
        const { id } = await params;

        const hunt = await prisma.hunt.findUnique({
            where: { id },
        });

        if (!hunt) {
            return NextResponse.json(
                {
                    message: "Chasse introuvable.",
                    error: "HUNT_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        const body = await request.json();

        const validation = createStepSchema.safeParse({
            ...body,
            huntId: id,
        });

        if (!validation.success) {
            return NextResponse.json(
                {
                    message: "Payload invalide.",
                    error: "VALIDATION_ERROR",
                    data: {
                        details: z.flattenError(validation.error),
                    },
                },
                { status: 400 },
            );
        }

        const step = await prisma.step.create({
            data: validation.data,
            include: {
                clues: true,
            },
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

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return NextResponse.json(
                    {
                        message: "Une étape avec ce numéro d'ordre existe déjà dans cette chasse.",
                        error: "INVALID_STEP_ORDER",
                    },
                    { status: 409 },
                );
            }

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