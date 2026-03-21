import {
    ErrorResponseSchema,
    MessageOnlyResponseSchema,
    StepClueListResponseSchema,
    StepListResponseSchema,
    StepWithCluesSchema,
    uuidParam,
    ValidationErrorResponseSchema,
} from "@/lib/openapi/components";
import { registry } from "@/lib/openapi/registry";
import { updateStepSchema } from "@/schemas/step";
import { z } from "zod";

const stepIdParam = uuidParam("id", "Identifiant de l'étape");

const UpdateStepRequestSchema = updateStepSchema.openapi("UpdateStepRequest");

const StepResponseSchema = z
.object({
    message: z.string(),
    data: StepWithCluesSchema,
})
.openapi("SingleStepResponse");

registry.registerPath({
    method: "get",
    path: "/api/steps",
    tags: ["Steps"],
    summary: "Lister les étapes",
    responses: {
        200: {
            description: "Liste des étapes.",
            content: {
                "application/json": {
                    schema: StepListResponseSchema,
                },
            },
        },
        500: {
            description: "Erreur serveur.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/api/steps/{id}",
    tags: ["Steps"],
    summary: "Récupérer une étape",
    request: {
        params: z.object({
            id: stepIdParam,
        }),
    },
    responses: {
        200: {
            description: "Étape trouvée.",
            content: {
                "application/json": {
                    schema: StepResponseSchema,
                },
            },
        },
        404: {
            description: "Étape introuvable.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        500: {
            description: "Erreur serveur.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: "patch",
    path: "/api/steps/{id}",
    tags: ["Steps"],
    summary: "Mettre à jour une étape",
    request: {
        params: z.object({
            id: stepIdParam,
        }),
        body: {
            content: {
                "application/json": {
                    schema: UpdateStepRequestSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Étape mise à jour.",
            content: {
                "application/json": {
                    schema: StepResponseSchema,
                },
            },
        },
        400: {
            description: "Payload invalide.",
            content: {
                "application/json": {
                    schema: ValidationErrorResponseSchema,
                },
            },
        },
        404: {
            description: "Étape introuvable.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        500: {
            description: "Erreur serveur.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: "delete",
    path: "/api/steps/{id}",
    tags: ["Steps"],
    summary: "Supprimer une étape",
    request: {
        params: z.object({
            id: stepIdParam,
        }),
    },
    responses: {
        200: {
            description: "Étape supprimée.",
            content: {
                "application/json": {
                    schema: MessageOnlyResponseSchema,
                },
            },
        },
        404: {
            description: "Étape introuvable.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        500: {
            description: "Erreur serveur.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/api/steps/{id}/clues",
    tags: ["Steps", "Clues"],
    summary: "Lister les indices d'une étape",
    request: {
        params: z.object({
            id: stepIdParam,
        }),
    },
    responses: {
        200: {
            description: "Liste des indices de l'étape.",
            content: {
                "application/json": {
                    schema: StepClueListResponseSchema,
                },
            },
        },
        404: {
            description: "Étape introuvable.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        500: {
            description: "Erreur serveur.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
    },
});