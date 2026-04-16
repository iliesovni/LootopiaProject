import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { huntOwnerDetailSelect, huntPublicListSelect } from "@/lib/db/includes/hunt.include";
import { prisma } from "@/lib/db/prisma";
import { createHuntSchema } from "@/schemas/hunt";
import { HuntMode, HuntStatus, HuntVisibility, Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
    try {
        const hunts = await prisma.hunt.findMany({
            where: {
                status: HuntStatus.PUBLISHED,
                visibility: HuntVisibility.PUBLIC,
                isDeleted: false,
            },
            select: huntPublicListSelect,
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            message: "Chasses récupérées avec succès.",
            data: {
                count: hunts.length,
                items: hunts,
            },
        });
    } catch (error) {
        console.error("GET /api/hunts error:", error);

        return NextResponse.json(
            {
                message: "Erreur lors de la récupération des chasses.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requireAuth();
        const body = await request.json();

        const validation = createHuntSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    message: "Payload invalide.",
                    error: "VALIDATION_ERROR",
                    data: {
                        details: z.flattenError(validation.error),
                    },
                },
                { status: 400 },
            );
        }

        if (currentUser.role !== Role.PLAYER && currentUser.role !== Role.PARTNER) {
            return NextResponse.json(
                {
                    message: "Ce rôle n'est pas autorisé à créer une chasse.",
                    error: "FORBIDDEN_ROLE",
                },
                { status: 403 },
            );
        }

        if (currentUser.role === Role.PARTNER) {
            const partnerProfile = await prisma.partner.findUnique({
                where: { userId: currentUser.id },
                select: { id: true },
            });

            if (!partnerProfile) {
                return NextResponse.json(
                    {
                        message: "Aucun profil partenaire associé à cet utilisateur.",
                        error: "PARTNER_PROFILE_NOT_FOUND",
                    },
                    { status: 400 },
                );
            }
        }

        const visibility = validation.data.visibility ?? HuntVisibility.PUBLIC;

        const accessCode = visibility === HuntVisibility.PRIVATE ? validation.data.accessCode ?? null : null;

        const hunt = await prisma.hunt.create({
            data: {
                title: validation.data.title,
                description: validation.data.description,
                location: validation.data.location,
                difficulty: validation.data.difficulty,
                startLat: validation.data.startLat,
                startLng: validation.data.startLng,

                visibility,
                accessCode,

                status: HuntStatus.DRAFT,

                createdById: currentUser.id,
                mode:
                    currentUser.role === Role.PARTNER
                        ? HuntMode.PARTNER
                        : HuntMode.COMMUNITY,
            },
            select: huntOwnerDetailSelect,
        });

        return NextResponse.json(
            {
                message: "Chasse créée avec succès.",
                data: hunt,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("POST /api/hunts error:", error);

        if (error instanceof AuthError) {
            return NextResponse.json(
                {
                    message: error.message,
                    error: error.code,
                },
                { status: error.status },
            );
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") {
                return NextResponse.json(
                    {
                        message: "Une relation fournie est invalide.",
                        error: "INVALID_REFERENCE_ID",
                    },
                    { status: 400 },
                );
            }
        }

        return NextResponse.json(
            {
                message: "Erreur lors de la création de la chasse.",
                error: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}