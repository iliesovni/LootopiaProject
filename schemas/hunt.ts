import { Difficulty } from "@prisma/client";
import { z } from "zod";

export const createHuntSchema = z.object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères."),
    description: z.string().optional().nullable(),
    location: z.string().min(2, "La localisation est obligatoire."),
    difficulty: z.enum(Difficulty),
    isPublic: z.boolean().optional(),
    startLat: z.number().min(-90).max(90),
    startLng: z.number().min(-180).max(180),
    createdById: z.uuid("L'identifiant du créateur doit être un UUID valide."),
});

export const updateHuntSchema = createHuntSchema
    .omit({ createdById: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Au moins un champ doit être fourni pour la mise à jour.",
    });