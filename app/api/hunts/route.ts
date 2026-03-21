import { huntInclude } from "@/lib/db/includes/hunt.include";
import { prisma } from "@/lib/db/prisma";
import { createHuntSchema } from "@/schemas/hunt";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
    try {
        const hunts = await prisma.hunt.findMany({
            include: huntInclude,
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            message: "Chasses récupérées avec succès.",
            data: {
                count: hunts.length,
                items: hunts,
            },
        });
    } catch (error) {
        console.error("GET /api/hunts error:", error);

        return NextResponse.json(
            {
                message: "Erreur lors de la récupération des chasses.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = createHuntSchema.safeParse(body);

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

        const hunt = await prisma.hunt.create({
            data: validation.data,
            include: huntInclude,
        });

        return NextResponse.json(
            {
                message: "Chasse créée avec succès.",
                data: hunt,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("POST /api/hunts error:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") {
                return NextResponse.json(
                    {
                        message: "Une relation fournie est invalide.",
                        error: "INVALID_REFERENCE_ID",
                    },
                    { status: 400 },
                );
            }
        }

        return NextResponse.json(
            {
                message: "Erreur lors de la création de la chasse.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}