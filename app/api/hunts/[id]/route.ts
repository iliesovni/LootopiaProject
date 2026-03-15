import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";
import { updateHuntSchema } from "@/schemas/hunt";

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

        const hunt = await prisma.hunt.findUnique({
            where: {
                id,
            },
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

        return NextResponse.json({
            ok: true,
            hunt,
        });
    } catch (error) {
        console.error("GET /api/hunts/[id] error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la récupération de la chasse.",
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
        const data = updateHuntSchema.parse(body);

        const existingHunt = await prisma.hunt.findUnique({
            where: { id },
        });

        if (!existingHunt) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Chasse introuvable.",
                },
                { status: 404 }
            );
        }

        const updatedHunt = await prisma.hunt.update({
            where: { id },
            data,
        });

        return NextResponse.json({
            ok: true,
            message: "Chasse mise à jour avec succès.",
            hunt: updatedHunt,
        });
    } catch (error) {
        console.error("PATCH /api/hunts/[id] error:", error);

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

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la mise à jour de la chasse.",
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

        const existingHunt = await prisma.hunt.findUnique({
            where: { id },
        });

        if (!existingHunt) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Chasse introuvable.",
                },
                { status: 404 }
            );
        }

        await prisma.hunt.delete({
            where: { id },
        });

        return NextResponse.json({
            ok: true,
            message: "Chasse supprimée avec succès.",
        });
    } catch (error) {
        console.error("DELETE /api/hunts/[id] error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la suppression de la chasse.",
            },
            { status: 500 }
        );
    }
}