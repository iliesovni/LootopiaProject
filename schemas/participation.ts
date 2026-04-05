import { z } from "zod";

export const startParticipationSchema = z.object({
    huntId: z.uuid("L'identifiant de la chasse doit être un UUID valide."),
});

export const completeStepSchema = z.object({
    stepId: z.uuid("L'identifiant de l'étape doit être un UUID valide."),
});

export const useClueSchema = z.object({
    stepId: z.uuid("L'identifiant de l'étape doit être un UUID valide."),
});