export function createTestUser(overrides = {}) {
    return {
        id: "user-test-id",
        email: "test@test.com",
        role: "PLAYER",
        ...overrides,
    };
}

export function createTestHunt(overrides = {}) {
    return {
        id: "hunt-test-id",
        title: "Test Hunt",
        status: "DRAFT",
        visibility: "PUBLIC",
        ...overrides,
    };
}