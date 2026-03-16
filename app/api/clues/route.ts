import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clueInclude } from "@/lib/prisma-includes";

export async function GET() {
    try {
        const clues = await prisma.clue.findMany({
            include: clueInclude,
            orderBy: [{ stepId: "asc" }, { orderIndex: "asc" }],
        });

        return NextResponse.json({
            ok: true,
            count: clues.length,
            clues,
        });
    } catch (error) {
        console.error("GET /api/clues error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la récupération des indices.",
            },
            { status: 500 }
        );
    }
}