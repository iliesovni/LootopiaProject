import {
    ClueCreatedResponseSchema,
    ClueResponseSchema,
    ClueUpdatedResponseSchema,
    CreateClueRequestSchema,
    ErrorResponseSchema,
    ValidationErrorResponseSchema,
} from "@/lib/openapi/components";
import { registry } from "@/lib/openapi/registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const clueIdParam = z.object({
    id: z.string().uuid().openapi({
        param: {
            name: "id",
            in: "path",
            required: true,
            description: "Identifiant de l'indice",
        },
        example: "33333333-3333-3333-3333-333333333333",
    }),
});

registry.registerPath({
    method: "post",
    path: "/api/clues",
    tags: ["Clues"],
    summary: "Créer un indice",
    security: [{ cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: CreateClueRequestSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Indice créé avec succès.",
            content: {
                "application/json": {
                    schema: ClueCreatedResponseSchema,
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
            description: "Conflit métier (limite, ordre, hunt publiée).",
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
    path: "/api/clues/{id}",
    tags: ["Clues"],
    summary: "Récupérer un indice",
    security: [{ cookieAuth: [] }],
    request: {
        params: clueIdParam,
    },
    responses: {
        200: {
            description: "Indice récupéré.",
            content: {
                "application/json": {
                    schema: ClueResponseSchema,
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
            description: "Indice introuvable.",
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
    path: "/api/clues/{id}",
    tags: ["Clues"],
    summary: "Mettre à jour un indice",
    security: [{ cookieAuth: [] }],
    request: {
        params: clueIdParam,
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: CreateClueRequestSchema.partial().openapi("PatchClueBody"),
                },
            },
        },
    },
    responses: {
        200: {
            description: "Indice mis à jour avec succès.",
            content: {
                "application/json": {
                    schema: ClueUpdatedResponseSchema,
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
            description: "Indice introuvable.",
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
    path: "/api/clues/{id}",
    tags: ["Clues"],
    summary: "Supprimer un indice",
    security: [{ cookieAuth: [] }],
    request: {
        params: clueIdParam,
    },
    responses: {
        200: {
            description: "Indice supprimé.",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: { type: "string", example: "Indice supprimé avec succès." },
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
            description: "Indice introuvable.",
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