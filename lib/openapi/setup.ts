import { registry } from "@/lib/openapi/registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

registry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "lootopia_token",
    description: `
Authentification via cookie HTTP-only.

Pour tester les routes protégées :
1. Exécuter /api/auth/login
2. Le cookie est automatiquement stocké
3. Les requêtes suivantes seront authentifiées
`,
});