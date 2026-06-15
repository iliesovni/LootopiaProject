import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",

    roots: ["<rootDir>"],

    testMatch: [
        "**/tests/integration/**/*.test.ts",
        "**/tests/integration/**/*.spec.ts",
    ],

    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },

    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

    clearMocks: true,
    maxWorkers: 1,
    setupFilesAfterEnv: ["<rootDir>/tests/integration/setup.integration.ts"],
};

export default config;