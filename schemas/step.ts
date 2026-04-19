import { ARMarkerType } from "@prisma/client";
import { z } from "zod";

export const createStepSchema = z.object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères."),
    description: z.string().min(1, "La description est obligatoire."),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusMeters: z.number().int().positive("Le rayon doit être supérieur à 0."),
    orderIndex: z.number().int().min(0, "L'ordre doit être supérieur ou égal à 0."),
    pointsReward: z.number().int().min(0, "Les points doivent être supérieurs ou égaux à 0."),
    huntId: z.uuid("L'identifiant de la chasse doit être un UUID valide."),
    arMarkerType: z.enum(ARMarkerType).optional().nullable(),
    arAssetUrl: z.string().url("L'URL du contenu AR doit être valide.").optional().nullable(),
});

export const updateStepSchema = z
.object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères.").optional(),
    description: z.string().min(1, "La description est obligatoire.").optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    radiusMeters: z.number().int().positive("Le rayon doit être supérieur à 0.").optional(),
    orderIndex: z.number().int().min(0, "L'ordre doit être supérieur ou égal à 0.").optional(),
    pointsReward: z.number().int().min(0, "Les points doivent être supérieurs ou égaux à 0.").optional(),
    arMarkerType: z.enum(ARMarkerType).optional().nullable(),
    arAssetUrl: z.string().url("L'URL du contenu AR doit être valide.").optional().nullable(),
})
.refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour.",
});