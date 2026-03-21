import {
    ErrorResponseSchema,
    HuntListResponseSchema,
    HuntWithStepsSchema,
    MessageOnlyResponseSchema,
    StepWithCluesSchema,
    uuidParam,
    ValidationErrorResponseSchema,
} from "@/lib/openapi/components";
import { registry } from "@/lib/openapi/registry";
import { createHuntSchema, updateHuntSchema } from "@/schemas/hunt";
import { createStepSchema } from "@/schemas/step";
import { z } from "zod";

const huntIdParam = uuidParam("id", "Identifiant de la chasse");

const CreateHuntRequestSchema = createHuntSchema.openapi("CreateHuntRequest");
const UpdateHuntRequestSchema = updateHuntSchema.openapi("UpdateHuntRequest");
const CreateStepForHuntRequestSchema = createStepSchema
.omit({ huntId: true })
.openapi("CreateStepForHuntRequest");

const HuntResponseSchema = z
.object({
    message: z.string(),
    data: HuntWithStepsSchema,
})
.openapi("HuntResponse");

const StepResponseSchema = z
.object({
    message: z.string(),
    data: StepWithCluesSchema.omit({ hunt: true }),
})
.openapi("StepResponse");

registry.registerPath({
    method: "get",
    path: "/api/hunts",
    tags: ["Hunts"],
    summary: "Lister les chasses",
    responses: {
        200: {
            description: "Liste des chasses.",
            content: {
                "application/json": {
                    schema: HuntListResponseSchema,
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
    request: {
        body: {
            content: {
                "application/json": {
                    schema: CreateHuntRequestSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Chasse créée.",
            content: {
                "application/json": {
                    schema: HuntResponseSchema,
                },
            },
        },
        400: {
            description: "Payload invalide ou relation invalide.",
            content: {
                "application/json": {
                    schema: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
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
    summary: "Récupérer une chasse",
    request: {
        params: z.object({
            id: huntIdParam,
        }),
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
    request: {
        params: z.object({
            id: huntIdParam,
        }),
        body: {
            content: {
                "application/json": {
                    schema: UpdateHuntRequestSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Chasse mise à jour.",
            content: {
                "application/json": {
                    schema: HuntResponseSchema,
                },
            },
        },
        400: {
            description: "Payload invalide ou relation invalide.",
            content: {
                "application/json": {
                    schema: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
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
    method: "delete",
    path: "/api/hunts/{id}",
    tags: ["Hunts"],
    summary: "Supprimer une chasse",
    request: {
        params: z.object({
            id: huntIdParam,
        }),
    },
    responses: {
        200: {
            description: "Chasse supprimée.",
            content: {
                "application/json": {
                    schema: MessageOnlyResponseSchema,
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
    method: "post",
    path: "/api/hunts/{id}/steps",
    tags: ["Hunts", "Steps"],
    summary: "Créer une étape dans une chasse",
    request: {
        params: z.object({
            id: huntIdParam,
        }),
        body: {
            content: {
                "application/json": {
                    schema: CreateStepForHuntRequestSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Étape créée.",
            content: {
                "application/json": {
                    schema: StepResponseSchema,
                },
            },
        },
        400: {
            description: "Payload invalide ou chasse invalide.",
            content: {
                "application/json": {
                    schema: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
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
            description: "Conflit sur l'ordre de l'étape.",
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