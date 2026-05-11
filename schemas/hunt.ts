import { Difficulty, HuntVisibility } from "@prisma/client";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createHuntSchema = z
.object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères."),
    description: z.string().optional().nullable(),
    location: z.string().min(2, "La localisation est obligatoire."),
    difficulty: z.enum(Difficulty),
    visibility: z.enum(HuntVisibility).optional(),
    accessCode: z.string().regex(/^\d{8}$/).optional(),
    startLat: z.number().min(-90).max(90),
    startLng: z.number().min(-180).max(180),
});

export const updateHuntSchema = z
.object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères.").optional(),
    description: z.string().optional().nullable(),
    location: z.string().min(2, "La localisation est obligatoire.").optional(),
    difficulty: z.enum(Difficulty).optional(),
    visibility: z.enum(HuntVisibility).optional(),
    accessCode: z.string().regex(/^\d{8}$/).optional(),
    startLat: z.number().min(-90).max(90).optional(),
    startLng: z.number().min(-180).max(180).optional(),
})
.refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour.",
});