import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { participationInclude } from "@/lib/db/includes/participation.include";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const currentUser = await requireAuth();
        const { id } = await context.params;

        const participation = await prisma.participation.findUnique({
            where: { id },
            include: participationInclude,
        });

        if (!participation) {
            return NextResponse.json(
                {
                    message: "Participation introuvable.",
                    error: "PARTICIPATION_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        if (participation.userId !== currentUser.id) {
            return NextResponse.json(
                {
                    message: "Vous n'avez pas accès à cette participation.",
                    error: "PARTICIPATION_FORBIDDEN",
                },
                { status: 403 },
            );
        }

        return NextResponse.json({
            message: "Participation récupérée avec succès.",
            data: participation,
        });
    } catch (error) {
        console.error("[GET_PARTICIPATION_ERROR]", error);

        if (error instanceof AuthError) {
            return NextResponse.json(
                {
                    message: error.message,
                    error: error.code,
                },
                { status: error.status },
            );
        }

        return NextResponse.json(
            {
                message: "Erreur serveur.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}