import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",

    roots: ["<rootDir>"],

    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

    testMatch: [
        "**/__tests__/**/*.test.ts",
        "**/__tests__/**/*.spec.ts",
        "**/*.test.ts",
        "**/*.spec.ts",
    ],

    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },

    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

    clearMocks: true,
    collectCoverageFrom: [
        "lib/**/*.ts",
        "api/**/*.ts",
        "schemas/**/*.ts",
        "!**/*.d.ts",
        "!**/node_modules/**",
    ],
};

export default config;