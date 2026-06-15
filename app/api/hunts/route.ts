import { apiError, apiSuccess } from "@/lib/api/responses";
import { apiValidationError } from "@/lib/api/validation";
import { AuthError } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { huntOwnerDetailSelect, huntPublicListSelect } from "@/lib/db/includes/hunt.include";
import { prisma } from "@/lib/db/prisma";
import { createHuntSchema } from "@/schemas/hunt";
import { HuntMode, HuntStatus, HuntVisibility, Prisma, Role } from "@prisma/client";
import { NextRequest } from "next/server";

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

        return apiSuccess("Chasses récupérées avec succès.", {
            count: hunts.length,
            items: hunts,
        });
    } catch (error) {
        console.error("GET /api/hunts error:", error);

        return apiError(
            "Erreur lors de la récupération des chasses.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requireAuth();
        const body = await request.json();

        const validation = createHuntSchema.safeParse(body);

        if (!validation.success) {
            return apiValidationError(validation.error);
        }

        if (currentUser.role !== Role.PLAYER && currentUser.role !== Role.PARTNER) {
            return apiError(
                "Ce rôle n'est pas autorisé à créer une chasse.",
                "FORBIDDEN_ROLE",
                403,
            );
        }

        if (currentUser.role === Role.PARTNER) {
            const partnerProfile = await prisma.partner.findUnique({
                where: { userId: currentUser.id },
                select: { id: true },
            });

            if (!partnerProfile) {
                return apiError(
                    "Aucun profil partenaire associé à cet utilisateur.",
                    "PARTNER_PROFILE_NOT_FOUND",
                    400,
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

        return apiSuccess("Chasse créée avec succès.", hunt, 201);
    } catch (error) {
        console.error("POST /api/hunts error:", error);

        if (error instanceof AuthError) {
            return apiError(error.message, error.code, error.status);
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") {
                return apiError(
                    "Une relation fournie est invalide.",
                    "INVALID_REFERENCE_ID",
                    400,
                );
            }
        }

        return apiError(
            "Erreur lors de la création de la chasse.",
            "INTERNAL_SERVER_ERROR",
            500,
        );
    }
}