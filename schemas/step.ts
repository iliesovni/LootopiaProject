import { ARMarkerType } from "@prisma/client";
import { z } from "zod";

export const createStepSchema = z.object({
    title: z.string().min(2, "Le titre doit contenir au moins 2 caractères."),
    description: z.string().min(2, "La description est obligatoire."),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusMeters: z.number().int().positive("Le rayon doit être supérieur à 0."),
    orderIndex: z.number().int().nonnegative("L'ordre doit être positif ou nul."),
    pointsReward: z.number().int().nonnegative("Les points doivent être positifs ou nuls."),
    arMarkerType: z.enum(ARMarkerType).optional().nullable(),
    arAssetUrl: z.url().optional().nullable(),
    huntId: z.uuid("L'identifiant de la chasse doit être un UUID valide."),
});

export const updateStepSchema = createStepSchema
    .omit({ huntId: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Au moins un champ doit être fourni pour la mise à jour.",
    });