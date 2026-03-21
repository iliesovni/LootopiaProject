import { z } from "zod";

export const createClueSchema = z.object({
    content: z.string().min(1, "Le contenu de l'indice est obligatoire."),
    penaltyPoints: z.number().int().nonnegative("La pénalité doit être positive ou nulle."),
    orderIndex: z.number().int().min(1, "L'ordre doit être supérieur ou égal à 1.").optional(),
    stepId: z.uuid("L'identifiant de l'étape doit être un UUID valide."),
});

export const updateClueSchema = createClueSchema
    .omit({ stepId: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Au moins un champ doit être fourni pour la mise à jour.",
    });