import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const users = await prisma.user.findMany();

        return NextResponse.json({
            ok: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("GET /api/test-db error:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Erreur lors de la connexion à la base de données.",
            },
            { status: 500 }
        );
    }
}