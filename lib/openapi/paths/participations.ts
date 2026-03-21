import {
    CompleteStepResponseSchema,
    ErrorResponseSchema,
    ParticipationFinishResponseSchema,
    ParticipationResponseSchema,
    ParticipationStartResponseSchema,
    UseClueResponseSchema,
    uuidParam,
    ValidationErrorResponseSchema,
} from "@/lib/openapi/components";
import { registry } from "@/lib/openapi/registry";
import { completeStepSchema, startParticipationSchema, useClueSchema } from "@/schemas/participation";
import { z } from "zod";

const participationIdParam = uuidParam("id", "Identifiant de la participation");

const StartParticipationRequestSchema = startParticipationSchema.openapi("StartParticipationRequest");
const CompleteStepRequestSchema = completeStepSchema.openapi("CompleteStepRequest");
const UseClueRequestSchema = useClueSchema.openapi("UseClueRequest");

registry.registerPath({
    method: "post",
    path: "/api/participations/start",
    tags: ["Participations"],
    summary: "Démarrer une participation",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: StartParticipationRequestSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Participation démarrée.",
            content: {
                "application/json": {
                    schema: ParticipationStartResponseSchema,
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
        403: {
            description: "Utilisateur non autorisé ou chasse non accessible.",
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
            description: "Participation déjà existante.",
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
    summary: "Récupérer une participation",
    request: {
        params: z.object({
            id: participationIdParam,
        }),
    },
    responses: {
        200: {
            description: "Participation trouvée.",
            content: {
                "application/json": {
                    schema: ParticipationResponseSchema,
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
    request: {
        params: z.object({
            id: participationIdParam,
        }),
        body: {
            content: {
                "application/json": {
                    schema: UseClueRequestSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Indice utilisé.",
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
        404: {
            description: "Participation ou étape introuvable.",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        409: {
            description: "Conflit métier : étape hors ordre, déjà complétée, plus d'indice disponible, etc.",
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
    request: {
        params: z.object({
            id: participationIdParam,
        }),
        body: {
            content: {
                "application/json": {
                    schema: CompleteStepRequestSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Étape complétée.",
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
    request: {
        params: z.object({
            id: participationIdParam,
        }),
    },
    responses: {
        200: {
            description: "Participation terminée.",
            content: {
                "application/json": {
                    schema: ParticipationFinishResponseSchema,
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