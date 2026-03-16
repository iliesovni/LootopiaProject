import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStepSchema } from "@/schemas/step";
import { z, ZodError } from "zod";
import {Prisma} from "@prisma/client";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function POST(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const { id } = await params;

        const hunt = await prisma.hunt.findUnique({
            where: { id },
        });

        if (!hunt) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Chasse introuvable.",
                },
                { status: 404 }
            );
        }

        const body = await request.json();
        const data = createStepSchema.parse({
            ...body,
            huntId: id,
        });

        const step = await prisma.step.create({
            data,
            include: {
                clues: true,
            },
        });

        return NextResponse.json(
            {
                ok: true,
                message: "Étape créée avec succès.",
                step,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/hunts/[id]/steps error:", error);

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

            if (error.code === "P2003") {
                return NextResponse.json(
                    {
                        ok: false,
                        message: "La chasse indiquée n'existe pas.",
                    },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la création de l'étape.",
            },
            { status: 500 }
        );
    }
}