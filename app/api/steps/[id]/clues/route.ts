import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> }
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
                    ok: false,
                    message: "Étape introuvable.",
                },
                { status: 404 }
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
            ok: true,
            count: clues.length,
            clues,
        });
    } catch (error) {
        console.error("GET /api/steps/[id]/clues error:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Erreur base de données lors de la récupération des indices.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la récupération des indices.",
            },
            { status: 500 }
        );
    }
}