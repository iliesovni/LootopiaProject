import { z } from "zod";

export const createClueSchema = z.object({
    content: z.string().min(1, "Le contenu de l'indice est obligatoire."),
    penaltyPoints: z.number().int().nonnegative("La pénalité doit être positive ou nulle."),
    orderIndex: z.number().int().nonnegative("L'ordre doit être positif ou nul."),
    stepId: z.uuid("L'identifiant de l'étape doit être un UUID valide."),
});

export const updateClueSchema = createClueSchema
    .omit({ stepId: true })
    .partial();