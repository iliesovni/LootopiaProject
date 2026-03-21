import { stepInclude } from "@/lib/db/includes/step.include";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const steps = await prisma.step.findMany({
            include: stepInclude,
            orderBy: [{ huntId: "asc" }, { orderIndex: "asc" }],
        });

        return NextResponse.json({
            message: "Les étapes ont été récupérées",
            data: {
                count: steps.length,
                items: steps,
            },
        });
    } catch (error) {
        console.error("GET /api/steps error:", error);

        return NextResponse.json(
            {
                message: "Erreur lors de la récupération des étapes.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}