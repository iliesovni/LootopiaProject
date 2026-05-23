import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createClueSchema = z.object({
    content: z.string().min(1, "Le contenu de l'indice est obligatoire."),
    penaltyPoints: z.number().int().min(0, "La pénalité doit être supérieure ou égale à 0."),
    stepId: z.uuid("L'identifiant de l'étape doit être un UUID valide."),
    orderIndex: z.number().int().min(0, "L'ordre doit être supérieur ou égal à 0.").optional(),
});

export const updateClueSchema = z
.object({
    content: z.string().min(1, "Le contenu de l'indice est obligatoire.").optional(),
    penaltyPoints: z.number().int().min(0, "La pénalité doit être supérieure ou égale à 0.").optional(),
    orderIndex: z.number().int().min(0, "L'ordre doit être supérieur ou égal à 0.").optional(),
})
.refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la mise à jour.",
});