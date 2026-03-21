import { Difficulty, HuntMode } from "@prisma/client";
import { z } from "zod";

const huntModeSchema = z.enum(HuntMode);

export const createHuntSchema = z
.object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères."),
    description: z.string().optional().nullable(),
    location: z.string().min(2, "La localisation est obligatoire."),
    difficulty: z.enum(Difficulty),
    mode: huntModeSchema.default("COMMUNITY"),
    partnerId: z
    .uuid("L'identifiant du partenaire doit être un UUID valide.")
    .optional()
    .nullable(),
    isPublic: z.boolean().optional(),
    startLat: z.number().min(-90).max(90),
    startLng: z.number().min(-180).max(180),
    createdById: z.uuid("L'identifiant du créateur doit être un UUID valide."),
})
.superRefine((data, ctx) => {
    if (data.mode === "PARTNER" && !data.partnerId) {
        ctx.addIssue({
            code: "custom",
            path: ["partnerId"],
            message: "partnerId est requis quand mode = PARTNER.",
        });
    }

    if (data.mode === "COMMUNITY" && data.partnerId) {
        ctx.addIssue({
            code: "custom",
            path: ["partnerId"],
            message: "partnerId doit être absent ou null quand mode = COMMUNITY.",
        });
    }
});

export const updateHuntSchema = z
.object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères.").optional(),
    description: z.string().optional().nullable(),
    location: z.string().min(2, "La localisation est obligatoire.").optional(),
    difficulty: z.enum(Difficulty).optional(),
    mode: huntModeSchema.optional(),
    partnerId: z
    .uuid("L'identifiant du partenaire doit être un UUID valide.")
    .optional()
    .nullable(),
    isPublic: z.boolean().optional(),
    startLat: z.number().min(-90).max(90).optional(),
    startLng: z.number().min(-180).max(180).optional(),
})
.refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour.",
})
.superRefine((data, ctx) => {
    if (data.mode === "PARTNER" && data.partnerId === null) {
        ctx.addIssue({
            code: "custom",
            path: ["partnerId"],
            message: "partnerId ne peut pas être null quand mode = PARTNER.",
        });
    }

    if (data.mode === "COMMUNITY" && data.partnerId) {
        ctx.addIssue({
            code: "custom",
            path: ["partnerId"],
            message: "partnerId doit être absent ou null quand mode = COMMUNITY.",
        });
    }
});