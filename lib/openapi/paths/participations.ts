import { registry } from "@/lib/openapi/registry";
import { completeStepSchema } from "@/schemas/participation";
import { z } from "zod";

const participationIdParam = z.uuid().openapi({
    param: {
        name: "id",
        in: "path",
        required: true,
        description: "Identifiant de la participation",
    },
    example: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
});

const completeStepResponseSchema = z
.object({
    message: z.string().openapi({ example: "Étape complétée avec succès." }),
    data: z.object({
        participationId: z.uuid(),
        stepId: z.uuid(),
        pointsEarned: z.number().int(),
        totalScore: z.number().int(),
    }),
})
.openapi("CompleteStepResponse");

registry.registerPath({
    method: "post",
    path: "/api/participations/{id}/complete-step",
    tags: ["Participations"],
    summary: "Compléter une étape",
    description: "Marque une étape comme complétée et met à jour le score.",
    request: {
        params: z.object({
            id: participationIdParam,
        }),
        body: {
            content: {
                "application/json": {
                    schema: completeStepSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Étape complétée avec succès.",
            content: {
                "application/json": {
                    schema: completeStepResponseSchema,
                },
            },
        },
        400: {
            description: "Payload invalide.",
        },
        404: {
            description: "Participation ou étape introuvable.",
        },
        409: {
            description: "Conflit métier.",
        },
    },
});