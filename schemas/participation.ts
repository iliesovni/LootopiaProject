import { z } from "zod";

export const startParticipationSchema = z.object({
    huntId: z.uuid("L'identifiant de la chasse doit être un UUID valide."),
    accessCode: z.string().trim().length(8, "Le code d'accès doit contenir 8 caractères.").optional().nullable(),
});

export const completeStepSchema = z.object({
    stepId: z.uuid("L'identifiant de l'étape doit être un UUID valide."),
});

export const useClueSchema = z.object({
    stepId: z.uuid("L'identifiant de l'étape doit être un UUID valide."),
});