import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {Prisma} from "@prisma/client";
import {z, ZodError} from "zod";

export async function GET() {
    try {
        const clues = await prisma.clue.findMany({
            include: {
                step: {
                    select: {
                        id: true,
                        title: true,
                        orderIndex: true,
                        huntId: true,
                    },
                },
            },
            orderBy: [{ stepId: "asc" }, { orderIndex: "asc" }],
        });

        return NextResponse.json({
            ok: true,
            count: clues.length,
            clues,
        });
    } catch (error) {
        console.error("POST /api/steps/[id]/clues error:", error);

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
                        message: "Un indice avec ce numéro d'ordre existe déjà pour cette étape.",
                    },
                    { status: 400 }
                );
            }

            if (error.code === "P2003") {
                return NextResponse.json(
                    {
                        ok: false,
                        message: "L'étape indiquée n'existe pas.",
                    },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la création de l'indice.",
            },
            { status: 500 }
        );
    }
}