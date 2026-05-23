import { prisma } from "@/lib/db/prisma";
import { getCreatedHunts, getHuntById, getPublicHunts, HuntNotFoundError } from "@/lib/services/hunt.service";
import { Difficulty, HuntMode, HuntStatus, HuntVisibility, Role } from "@prisma/client";

describe("integration - hunt read", () => {
    async function createUser(unique: string, role: Role = Role.PLAYER) {
        return prisma.user.create({
            data: {
                email: `${ unique }@integration.local`,
                username: unique,
                passwordHash: "hashed-password",
                role,
            },
        });
    }

    async function createHunt(unique: string, options?: {
        status?: HuntStatus;
        visibility?: HuntVisibility;
        isDeleted?: boolean;
        ownerId?: string;
    }) {
        const owner =
            options?.ownerId
                ? { id: options.ownerId }
                : await createUser(`owner-${ unique }`);

        return prisma.hunt.create({
            data: {
                title: `Hunt ${ unique }`,
                description: "Test hunt",
                location: "Paris",
                difficulty: Difficulty.EASY,
                startLat: 48.8566,
                startLng: 2.3522,
                createdById: owner.id,
                mode: HuntMode.COMMUNITY,
                status: options?.status ?? HuntStatus.DRAFT,
                visibility: options?.visibility ?? HuntVisibility.PUBLIC,
                isDeleted: options?.isDeleted ?? false,
            },
        });
    }

    it("should allow public access to a published hunt", async () => {
        // Arrange
        const unique = `hunt-public-${ Date.now() }`;
        const hunt = await createHunt(unique, {
            status: HuntStatus.PUBLISHED,
        });

        // Act
        const result = await getHuntById({
            huntId: hunt.id,
        });

        // Assert
        expect(result.id).toBe(hunt.id);

        // 🔐 Important : pas d’accessCode exposé
        expect((result as any).accessCode).toBeUndefined();
    });

    it("should allow owner to access a draft hunt", async () => {
        // Arrange
        const unique = `hunt-owner-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`);

        const hunt = await createHunt(unique, {
            ownerId: owner.id,
            status: HuntStatus.DRAFT,
        });

        // Act
        const result = await getHuntById({
            huntId: hunt.id,
            currentUserId: owner.id,
        });

        // Assert
        expect(result.id).toBe(hunt.id);

        // owner a accès aux champs complets
        expect(result).toHaveProperty("status");
        expect(result).toHaveProperty("visibility");
    });

    it("should NOT allow non-owner to access a draft hunt", async () => {
        // Arrange
        const unique = `hunt-forbidden-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`);
        const otherUser = await createUser(`other-${ unique }`);

        const hunt = await createHunt(unique, {
            ownerId: owner.id,
            status: HuntStatus.DRAFT,
        });

        // Act + Assert
        await expect(
            getHuntById({
                huntId: hunt.id,
                currentUserId: otherUser.id,
            }),
        ).rejects.toThrow(HuntNotFoundError);
    });

    it("should NOT return a deleted hunt", async () => {
        // Arrange
        const unique = `hunt-deleted-${ Date.now() }`;
        const hunt = await createHunt(unique, {
            status: HuntStatus.PUBLISHED,
            isDeleted: true,
        });

        // Act + Assert
        await expect(
            getHuntById({
                huntId: hunt.id,
            }),
        ).rejects.toThrow(HuntNotFoundError);
    });

    it("should return only published, public and non-deleted hunts", async () => {
        // Arrange
        const unique = `hunt-list-${ Date.now() }`;

        const huntA = await createHunt(`${ unique }-A`, {
            status: HuntStatus.PUBLISHED,
            visibility: HuntVisibility.PUBLIC,
            isDeleted: false,
        });

        const huntB = await createHunt(`${ unique }-B`, {
            status: HuntStatus.DRAFT,
            visibility: HuntVisibility.PUBLIC,
        });

        const huntC = await createHunt(`${ unique }-C`, {
            status: HuntStatus.PUBLISHED,
            visibility: HuntVisibility.PRIVATE,
        });

        const huntD = await createHunt(`${ unique }-D`, {
            status: HuntStatus.PUBLISHED,
            visibility: HuntVisibility.PUBLIC,
            isDeleted: true,
        });

        // Act
        const hunts = await getPublicHunts();

        // Assert
        const huntIds = hunts.map((hunt) => hunt.id);

        expect(huntIds).toContain(huntA.id);
        expect(huntIds).not.toContain(huntB.id);
        expect(huntIds).not.toContain(huntC.id);
        expect(huntIds).not.toContain(huntD.id);

        const publicHunt = hunts.find((hunt) => hunt.id === huntA.id);
        expect(publicHunt).toBeDefined();

        // 🔐 sécurité : pas de données sensibles
        expect((publicHunt as any)?.accessCode).toBeUndefined();
    });

    it("should return only hunts created by the current user, including deleted ones", async () => {
        // Arrange
        const unique = `hunt-created-${ Date.now() }`;

        const userA = await createUser(`userA-${ unique }`);
        const userB = await createUser(`userB-${ unique }`);

        const huntA1 = await createHunt(`${ unique }-A1`, {
            ownerId: userA.id,
        });

        const huntA2 = await createHunt(`${ unique }-A2`, {
            ownerId: userA.id,
            isDeleted: true, // supprimée mais visible pour owner
        });

        const huntB1 = await createHunt(`${ unique }-B1`, {
            ownerId: userB.id,
        });

        // Act
        const hunts = await getCreatedHunts(userA.id);

        // Assert
        const huntIds = hunts.map((hunt) => hunt.id);

        expect(huntIds).toContain(huntA1.id);
        expect(huntIds).toContain(huntA2.id);
        expect(huntIds).not.toContain(huntB1.id);

        const hunt = hunts.find(h => h.id === huntA1.id);

        expect(hunt).toHaveProperty("status");
        expect(hunt).toHaveProperty("visibility");
    });
});