import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateClueSchema } from "@/schemas/clue";
import { z, ZodError } from "zod";
import {Prisma} from "@prisma/client";
import { clueInclude } from "@/lib/prisma-includes";

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

        const clue = await prisma.clue.findUnique({
            where: { id },
            include: clueInclude,
        });

        if (!clue) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Indice introuvable.",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            clue,
        });
    } catch (error) {
        console.error("GET /api/clues/[id] error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la récupération de l'indice.",
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
        const data = updateClueSchema.parse(body);

        const existingClue = await prisma.clue.findUnique({
            where: { id },
        });

        if (!existingClue) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Indice introuvable.",
                },
                { status: 404 }
            );
        }

        const updatedClue = await prisma.clue.update({
            where: { id },
            data,
        });

        return NextResponse.json({
            ok: true,
            message: "Indice mis à jour avec succès.",
            clue: updatedClue,
        });
    } catch (error) {
        console.error("PATCH /api/clues/[id] error:", error);

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
        }

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la mise à jour de l'indice.",
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

        const existingClue = await prisma.clue.findUnique({
            where: { id },
        });

        if (!existingClue) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Indice introuvable.",
                },
                { status: 404 }
            );
        }

        await prisma.clue.delete({
            where: { id },
        });

        return NextResponse.json({
            ok: true,
            message: "Indice supprimé avec succès.",
        });
    } catch (error) {
        console.error("DELETE /api/clues/[id] error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la suppression de l'indice.",
            },
            { status: 500 }
        );
    }
}