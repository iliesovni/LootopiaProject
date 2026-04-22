import {
    ClueListResponseSchema,
    CreateStepRequestSchema,
    ErrorResponseSchema,
    StepCreatedResponseSchema,
    StepListResponseSchema,
    StepResponseSchema,
    StepUpdatedResponseSchema,
    ValidationErrorResponseSchema,
} from "@/lib/openapi/components";
import { registry } from "@/lib/openapi/registry";
import { z } from "zod";

const huntIdParam = z.object({
    id: z.uuid().openapi({
        param: {
            name: "id",
            in: "path",
            required: true,
            description: "Identifiant de la chasse",
        },
        example: "11111111-1111-1111-1111-111111111111",
    }),
});

const stepIdParam = z.object({
    id: z.uuid().openapi({
        param: {
            name: "id",
            in: "path",
            required: true,
            description: "Identifiant de l'étape",
        },
        example: "22222222-2222-2222-2222-222222222222",
    }),
});

registry.registerPath({
    method: "post",
    path: "/api/hunts/{id}/steps",
    tags: ["Steps"],
    summary: "Créer une étape pour une chasse",
    security: [{ cookieAuth: [] }],
    request: {
        params: huntIdParam,
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: CreateStepRequestSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Étape créée avec succès.",
            content: {
                "application/json": {
                    schema: StepCreatedResponseSchema,
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
        401: {
            description: "Non authentifié.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        403: {
            description: "Accès interdit.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        404: {
            description: "Chasse introuvable.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        409: {
            description: "Conflit métier (ordre, hunt publiée).",
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
    path: "/api/steps",
    tags: ["Steps"],
    summary: "Lister les étapes accessibles",
    security: [{ cookieAuth: [] }],
    responses: {
        200: {
            description: "Étapes récupérées.",
            content: {
                "application/json": {
                    schema: StepListResponseSchema,
                },
            },
        },
        401: {
            description: "Non authentifié.",
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
    path: "/api/steps/{id}",
    tags: ["Steps"],
    summary: "Récupérer une étape",
    security: [{ cookieAuth: [] }],
    request: {
        params: stepIdParam,
    },
    responses: {
        200: {
            description: "Étape récupérée.",
            content: {
                "application/json": {
                    schema: StepResponseSchema,
                },
            },
        },
        401: {
            description: "Non authentifié.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        403: {
            description: "Accès interdit.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
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
    security: [{ cookieAuth: [] }],
    request: {
        params: stepIdParam,
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: CreateStepRequestSchema.partial().openapi("PatchStepBody"),
                },
            },
        },
    },
    responses: {
        200: {
            description: "Étape mise à jour avec succès.",
            content: {
                "application/json": {
                    schema: StepUpdatedResponseSchema,
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
        401: {
            description: "Non authentifié.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        403: {
            description: "Accès interdit.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
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
        409: {
            description: "Conflit métier.",
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
    security: [{ cookieAuth: [] }],
    request: {
        params: stepIdParam,
    },
    responses: {
        200: {
            description: "Étape supprimée.",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: { type: "string", example: "Étape supprimée avec succès." },
                        },
                    },
                },
            },
        },
        401: {
            description: "Non authentifié.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        403: {
            description: "Accès interdit.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
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
        409: {
            description: "Conflit métier.",
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
    tags: ["Steps"],
    summary: "Lister les indices d'une étape (owner only)",
    security: [{ cookieAuth: [] }],
    request: {
        params: stepIdParam,
    },
    responses: {
        200: {
            description: "Indices récupérés.",
            content: {
                "application/json": {
                    schema: ClueListResponseSchema,
                },
            },
        },
        401: {
            description: "Non authentifié.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        403: {
            description: "Accès interdit.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
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