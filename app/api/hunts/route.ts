import {NextRequest, NextResponse} from "next/server";
import { prisma } from "@/lib/prisma";
import { createHuntSchema } from "@/schemas/hunt";
import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";

export async function GET() {
    try {
        const hunts = await prisma.hunt.findMany({
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                    },
                },
                steps: {
                    orderBy: {
                        orderIndex: "asc",
                    },
                    include: {
                        clues: {
                            orderBy: {
                                orderIndex: "asc",
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            ok: true,
            count: hunts.length,
            hunts,
        });
    } catch (error) {
        console.error("GET /api/hunts error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la récupération des chasses.",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = createHuntSchema.parse(body);

        const hunt = await prisma.hunt.create({
            data,
        });

        return NextResponse.json(
            {
                ok: true,
                message: "Chasse créée avec succès.",
                hunt,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/hunts error:", error);

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
            if (error.code === "P2003") {
                return NextResponse.json(
                    {
                        ok: false,
                        message: "Le créateur indiqué n'existe pas.",
                    },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la création de la chasse.",
            },
            { status: 500 }
        );
    }
}

