import "@/lib/openapi/setup";

import "@/lib/openapi/components";
import "@/lib/openapi/paths/auth";
import "@/lib/openapi/paths/clues";
import "@/lib/openapi/paths/hunts";
import "@/lib/openapi/paths/participations";
import "@/lib/openapi/paths/steps";
import { registry } from "@/lib/openapi/registry";

import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

export const swaggerSpec = new OpenApiGeneratorV3(
    registry.definitions,
).generateDocument({
    openapi: "3.0.0",
    info: {
        title: "Lootopia API",
        version: "1.0.0",
        description: "Documentation de l'API Lootopia",
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Serveur local",
        },
    ],
    tags: [
        { name: "Auth", description: "Authentification et session utilisateur" },
        { name: "Hunts", description: "Gestion des chasses" },
        { name: "Steps", description: "Gestion des étapes" },
        { name: "Clues", description: "Gestion des indices" },
        { name: "Participations", description: "Gestion des participations joueur" },
    ],
});