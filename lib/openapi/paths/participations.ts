import {
    CompleteStepRequestSchema,
    CompleteStepResponseSchema,
    ErrorResponseSchema,
    ParticipationGameplayResponseSchema,
    StartParticipationRequestSchema,
    UseClueRequestSchema,
    UseClueResponseSchema,
    ValidationErrorResponseSchema,
} from "@/lib/openapi/components";
import { registry } from "@/lib/openapi/registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const participationIdParam = z.object({
    id: z.uuid().openapi({
        param: {
            name: "id",
            in: "path",
            required: true,
            description: "Identifiant de la participation",
        },
        example: "44444444-4444-4444-4444-444444444444",
    }),
});

registry.registerPath({
    method: "post",
    path: "/api/participations/start",
    tags: ["Participations"],
    summary: "Démarrer une participation",
    security: [{ cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: StartParticipationRequestSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Participation démarrée avec succès.",
            content: {
                "application/json": {
                    schema: ParticipationGameplayResponseSchema,
                },
            },
        },
        400: {
            description: "Payload invalide ou hunt sans étape.",
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
            description: "Accès interdit ou access code invalide.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        404: {
            description: "Utilisateur ou chasse introuvable.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        409: {
            description: "Conflit métier (déjà existante, hunt non publiée, etc.).",
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
    path: "/api/participations/{id}",
    tags: ["Participations"],
    summary: "Récupérer une participation (vue gameplay)",
    security: [{ cookieAuth: [] }],
    request: {
        params: participationIdParam,
    },
    responses: {
        200: {
            description: "Participation récupérée avec succès.",
            content: {
                "application/json": {
                    schema: ParticipationGameplayResponseSchema,
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
            description: "Participation introuvable.",
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
    path: "/api/participations/{id}/use-clue",
    tags: ["Participations"],
    summary: "Utiliser un indice",
    security: [{ cookieAuth: [] }],
    request: {
        params: participationIdParam,
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: UseClueRequestSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Indice utilisé avec succès.",
            content: {
                "application/json": {
                    schema: UseClueResponseSchema,
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
            description: "Participation ou étape introuvable.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        409: {
            description: "Conflit métier (ordre, étape, indices).",
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
    path: "/api/participations/{id}/complete-step",
    tags: ["Participations"],
    summary: "Compléter une étape",
    security: [{ cookieAuth: [] }],
    request: {
        params: participationIdParam,
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: CompleteStepRequestSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Étape complétée avec succès.",
            content: {
                "application/json": {
                    schema: CompleteStepResponseSchema,
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
            description: "Participation ou étape introuvable.",
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
    method: "post",
    path: "/api/participations/{id}/finish",
    tags: ["Participations"],
    summary: "Terminer une participation",
    security: [{ cookieAuth: [] }],
    request: {
        params: participationIdParam,
    },
    responses: {
        200: {
            description: "Participation terminée avec succès.",
            content: {
                "application/json": {
                    schema: ParticipationGameplayResponseSchema,
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
            description: "Participation introuvable.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        409: {
            description: "Participation non terminable dans l'état courant.",
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