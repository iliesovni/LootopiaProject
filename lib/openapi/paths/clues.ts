import {
    ClueListResponseSchema,
    ClueWithStepSchema,
    ErrorResponseSchema,
    MessageOnlyResponseSchema,
    uuidParam,
    ValidationErrorResponseSchema,
} from "@/lib/openapi/components";
import { registry } from "@/lib/openapi/registry";
import { createClueSchema, updateClueSchema } from "@/schemas/clue";
import { z } from "zod";

const clueIdParam = uuidParam("id", "Identifiant de l'indice");

const CreateClueRequestSchema = createClueSchema.openapi("CreateClueRequest");
const UpdateClueRequestSchema = updateClueSchema.openapi("UpdateClueRequest");

const ClueResponseSchema = z
.object({
    message: z.string(),
    data: ClueWithStepSchema,
})
.openapi("ClueResponse");

registry.registerPath({
    method: "get",
    path: "/api/clues",
    tags: ["Clues"],
    summary: "Lister les indices",
    responses: {
        200: {
            description: "Liste des indices.",
            content: {
                "application/json": {
                    schema: ClueListResponseSchema,
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
    method: "post",
    path: "/api/clues",
    tags: ["Clues"],
    summary: "Créer un indice",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: CreateClueRequestSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Indice créé.",
            content: {
                "application/json": {
                    schema: ClueResponseSchema,
                },
            },
        },
        400: {
            description: "Payload invalide ou référence invalide.",
            content: {
                "application/json": {
                    schema: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
                },
            },
        },
        404: {
            description: "Step introuvable.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        409: {
            description: "Conflit d'ordre sur l'indice.",
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
    request: {
        params: z.object({
            id: clueIdParam,
        }),
    },
    responses: {
        200: {
            description: "Indice trouvé.",
            content: {
                "application/json": {
                    schema: ClueResponseSchema,
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
    request: {
        params: z.object({
            id: clueIdParam,
        }),
        body: {
            content: {
                "application/json": {
                    schema: UpdateClueRequestSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Indice mis à jour.",
            content: {
                "application/json": {
                    schema: ClueResponseSchema,
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
    method: "delete",
    path: "/api/clues/{id}",
    tags: ["Clues"],
    summary: "Supprimer un indice",
    request: {
        params: z.object({
            id: clueIdParam,
        }),
    },
    responses: {
        200: {
            description: "Indice supprimé.",
            content: {
                "application/json": {
                    schema: MessageOnlyResponseSchema,
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