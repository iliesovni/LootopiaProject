import "@/lib/openapi/setup";
import "@/lib/openapi/paths/participations";
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
        },
    ],
});