import {
    ErrorResponseSchema,
    LoginRequestSchema,
    LoginResponseSchema,
    LogoutResponseSchema,
    MeResponseSchema,
    RegisterRequestSchema,
    RegisterResponseSchema,
    ValidationErrorResponseSchema,
} from "@/lib/openapi/components";
import { registry } from "@/lib/openapi/registry";

registry.registerPath({
    method: "post",
    path: "/api/auth/register",
    tags: ["Auth"],
    summary: "Créer un compte utilisateur",
    request: {
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: RegisterRequestSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Utilisateur créé avec succès.",
            content: {
                "application/json": {
                    schema: RegisterResponseSchema,
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
        409: {
            description: "Utilisateur déjà existant.",
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
    path: "/api/auth/login",
    tags: ["Auth"],
    summary: "Se connecter",
    request: {
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: LoginRequestSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Connexion réussie.",
            content: {
                "application/json": {
                    schema: LoginResponseSchema,
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
            description: "Identifiants invalides.",
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
    path: "/api/auth/me",
    tags: ["Auth"],
    summary: "Récupérer l'utilisateur courant",
    security: [{ cookieAuth: [] }],
    responses: {
        200: {
            description: "Utilisateur authentifié.",
            content: {
                "application/json": {
                    schema: MeResponseSchema,
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
    method: "post",
    path: "/api/auth/logout",
    tags: ["Auth"],
    summary: "Se déconnecter",
    security: [{ cookieAuth: [] }],
    responses: {
        200: {
            description: "Déconnexion réussie.",
            content: {
                "application/json": {
                    schema: LogoutResponseSchema,
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