import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;

        const step = await prisma.step.findUnique({
            where: { id },
            select: {
                id: true,
            },
        });

        if (!step) {
            return NextResponse.json(
                {
                    message: "Étape introuvable.",
                    error: "STEP_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        const clues = await prisma.clue.findMany({
            where: { stepId: id },
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
            orderBy: {
                orderIndex: "asc",
            },
        });

        return NextResponse.json({
            message: "Indices de l'étape récupérés avec succès.",
            data: {
                count: clues.length,
                items: clues,
            },
        });
    } catch (error) {
        console.error("GET /api/steps/[id]/clues error:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return NextResponse.json(
                {
                    message: "Erreur base de données lors de la récupération des indices.",
                    error: "INTERNAL_SERVER_ERROR",
                },
                { status: 500 },
            );
        }

        return NextResponse.json(
            {
                message: "Erreur lors de la récupération des indices.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}