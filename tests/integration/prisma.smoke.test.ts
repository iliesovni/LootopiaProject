import { prisma } from "@/lib/db/prisma";

describe("integration - prisma smoke", () => {
    it("should connect to the test database and read seeded users", async () => {
        // Act
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
            },
            orderBy: {
                email: "asc",
            },
        });

        // Assert
        expect(users.length).toBeGreaterThan(0);

        expect(users).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    email: expect.stringContaining("@lootopia.local"),
                }),
            ]),
        );
    });
});