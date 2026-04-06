import {
    CreateHuntRequestSchema,
    ErrorResponseSchema,
    HuntCreatedResponseSchema,
    HuntPublicListResponseSchema,
    HuntResponseSchema,
    HuntUpdatedResponseSchema,
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

registry.registerPath({
    method: "get",
    path: "/api/hunts",
    tags: ["Hunts"],
    summary: "Lister les chasses publiques",
    responses: {
        200: {
            description: "Liste des chasses publiques.",
            content: {
                "application/json": {
                    schema: HuntPublicListResponseSchema,
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
    path: "/api/hunts",
    tags: ["Hunts"],
    summary: "Créer une chasse",
    security: [{ cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: CreateHuntRequestSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Chasse créée avec succès.",
            content: {
                "application/json": {
                    schema: HuntCreatedResponseSchema,
                },
            },
        },
        400: {
            description: "Payload invalide ou profil partenaire invalide.",
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
            description: "Rôle non autorisé.",
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
    path: "/api/hunts/{id}",
    tags: ["Hunts"],
    summary: "Récupérer le détail d'une chasse",
    request: {
        params: huntIdParam,
    },
    responses: {
        200: {
            description: "Chasse trouvée.",
            content: {
                "application/json": {
                    schema: HuntResponseSchema,
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
    path: "/api/hunts/{id}",
    tags: ["Hunts"],
    summary: "Mettre à jour une chasse",
    security: [{ cookieAuth: [] }],
    request: {
        params: huntIdParam,
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: CreateHuntRequestSchema.partial().openapi("PatchHuntBody"),
                },
            },
        },
    },
    responses: {
        200: {
            description: "Chasse mise à jour avec succès.",
            content: {
                "application/json": {
                    schema: HuntUpdatedResponseSchema,
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
            description: "Chasse non modifiable.",
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
    path: "/api/hunts/{id}",
    tags: ["Hunts"],
    summary: "Supprimer une chasse (soft delete)",
    security: [{ cookieAuth: [] }],
    request: {
        params: huntIdParam,
    },
    responses: {
        200: {
            description: "Chasse supprimée avec succès.",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: { type: "string", example: "Chasse supprimée avec succès." },
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
            description: "Chasse introuvable.",
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