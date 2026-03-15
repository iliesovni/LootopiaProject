import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const steps = await prisma.step.findMany({
            include: {
                hunt: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                    },
                },
                clues: {
                    orderBy: {
                        orderIndex: "asc",
                    },
                },
            },
            orderBy: [{ huntId: "asc" }, { orderIndex: "asc" }],
        });

        return NextResponse.json({
            ok: true,
            count: steps.length,
            steps,
        });
    } catch (error) {
        console.error("GET /api/steps error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la récupération des étapes.",
            },
            { status: 500 }
        );
    }
}