import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { participationInclude } from "@/lib/prisma-includes";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(
    _request: NextRequest,
    { params }: RouteContext
) {
    const { id } = await params;

    const participation = await prisma.participation.findUnique({
        where: { id },
        include: participationInclude,
    });

    if (!participation) {
        return NextResponse.json(
            {
                ok: false,
                message: "Participation introuvable.",
            },
            { status: 404 }
        );
    }

    return NextResponse.json({
        ok: true,
        participation,
    });
}