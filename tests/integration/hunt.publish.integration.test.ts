import { prisma } from "@/lib/db/prisma";
import { publishHunt } from "@/lib/services/hunt.service";
import { ARMarkerType, Difficulty, HuntMode, HuntStatus, HuntVisibility, Role } from "@prisma/client";

describe("integration - publishHunt", () => {
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

    async function createDraftHuntWithSteps(unique: string, ownerId: string) {
        return prisma.hunt.create({
            data: {
                title: `Publish Hunt ${ unique }`,
                description: "Test",
                location: "Paris",
                difficulty: Difficulty.EASY,
                startLat: 48.8566,
                startLng: 2.3522,
                createdById: ownerId,
                mode: HuntMode.COMMUNITY,
                status: HuntStatus.DRAFT,
                visibility: HuntVisibility.PUBLIC,
                steps: {
                    create: [
                        {
                            title: "Step 1",
                            description: "Step 1",
                            latitude: 48.8566,
                            longitude: 2.3522,
                            radiusMeters: 50,
                            orderIndex: 0,
                            pointsReward: 100,
                            arMarkerType: ARMarkerType.IMAGE,
                        },
                        {
                            title: "Step 2",
                            description: "Step 2",
                            latitude: 48.857,
                            longitude: 2.353,
                            radiusMeters: 50,
                            orderIndex: 1,
                            pointsReward: 100,
                            arMarkerType: ARMarkerType.IMAGE,
                        },
                    ],
                },
            },
            include: {
                steps: true,
            },
        });
    }

    it("should publish a valid draft hunt", async () => {
        // Arrange
        const unique = `publish-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`);

        const hunt = await createDraftHuntWithSteps(unique, owner.id);

        // Act
        const result = await publishHunt({
            huntId: hunt.id,
            currentUserId: owner.id,
        });

        // Assert
        expect(result.status).toBe(HuntStatus.PUBLISHED);

        const updated = await prisma.hunt.findUnique({
            where: { id: hunt.id },
        });

        expect(updated?.status).toBe(HuntStatus.PUBLISHED);
    });

    it("should reject publish if not owner", async () => {
        const unique = `publish-forbidden-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`);
        const other = await createUser(`other-${ unique }`);

        const hunt = await createDraftHuntWithSteps(unique, owner.id);

        await expect(
            publishHunt({ huntId: hunt.id, currentUserId: other.id }),
        ).rejects.toThrow("FORBIDDEN");
    });

    it("should reject publish if hunt is deleted", async () => {
        const unique = `publish-deleted-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`);

        const hunt = await createDraftHuntWithSteps(unique, owner.id);

        await prisma.hunt.update({
            where: { id: hunt.id },
            data: { isDeleted: true },
        });

        await expect(
            publishHunt({ huntId: hunt.id, currentUserId: owner.id }),
        ).rejects.toThrow("HUNT_DELETED");
    });

    it("should reject publish if already published", async () => {
        const unique = `publish-already-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`);

        const hunt = await createDraftHuntWithSteps(unique, owner.id);

        await publishHunt({ huntId: hunt.id, currentUserId: owner.id });

        await expect(
            publishHunt({ huntId: hunt.id, currentUserId: owner.id }),
        ).rejects.toThrow("HUNT_ALREADY_PUBLISHED");
    });

    it("should reject publish if less than 2 steps", async () => {
        const unique = `publish-steps-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`);

        const hunt = await prisma.hunt.create({
            data: {
                title: "Invalid hunt",
                description: "Test",
                location: "Paris",
                difficulty: Difficulty.EASY,
                startLat: 48.8566,
                startLng: 2.3522,
                createdById: owner.id,
                mode: HuntMode.COMMUNITY,
                status: HuntStatus.DRAFT,
                visibility: HuntVisibility.PUBLIC,
                steps: {
                    create: [
                        {
                            title: "Only step",
                            description: "Step",
                            latitude: 48.8566,
                            longitude: 2.3522,
                            radiusMeters: 50,
                            orderIndex: 0,
                            pointsReward: 100,
                            arMarkerType: ARMarkerType.IMAGE,
                        },
                    ],
                },
            },
        });

        await expect(
            publishHunt({ huntId: hunt.id, currentUserId: owner.id }),
        ).rejects.toThrow("HUNT_NOT_ENOUGH_STEPS");
    });

    it("should reject publish of a private hunt without access code", async () => {
        const unique = `publish-private-no-code-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`);

        const hunt = await prisma.hunt.create({
            data: {
                title: `Private Hunt ${ unique }`,
                description: "Test",
                location: "Paris",
                difficulty: Difficulty.EASY,
                startLat: 48.8566,
                startLng: 2.3522,
                createdById: owner.id,
                mode: HuntMode.COMMUNITY,
                status: HuntStatus.DRAFT,
                visibility: HuntVisibility.PRIVATE,
                accessCode: null,
                steps: {
                    create: [
                        {
                            title: "Step 1",
                            description: "Step 1",
                            latitude: 48.8566,
                            longitude: 2.3522,
                            radiusMeters: 50,
                            orderIndex: 0,
                            pointsReward: 100,
                            arMarkerType: ARMarkerType.IMAGE,
                        },
                        {
                            title: "Step 2",
                            description: "Step 2",
                            latitude: 48.857,
                            longitude: 2.353,
                            radiusMeters: 50,
                            orderIndex: 1,
                            pointsReward: 100,
                            arMarkerType: ARMarkerType.IMAGE,
                        },
                    ],
                },
            },
        });

        await expect(
            publishHunt({ huntId: hunt.id, currentUserId: owner.id }),
        ).rejects.toThrow("HUNT_MISSING_ACCESS_CODE");
    });

    it("should reject publish if steps order is not sequential", async () => {
        const unique = `publish-invalid-order-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`);

        const hunt = await prisma.hunt.create({
            data: {
                title: `Invalid Order Hunt ${ unique }`,
                description: "Test",
                location: "Paris",
                difficulty: Difficulty.EASY,
                startLat: 48.8566,
                startLng: 2.3522,
                createdById: owner.id,
                mode: HuntMode.COMMUNITY,
                status: HuntStatus.DRAFT,
                visibility: HuntVisibility.PUBLIC,
                steps: {
                    create: [
                        {
                            title: "Step 1",
                            description: "Step 1",
                            latitude: 48.8566,
                            longitude: 2.3522,
                            radiusMeters: 50,
                            orderIndex: 0,
                            pointsReward: 100,
                            arMarkerType: ARMarkerType.IMAGE,
                        },
                        {
                            title: "Step 2",
                            description: "Step 2",
                            latitude: 48.857,
                            longitude: 2.353,
                            radiusMeters: 50,
                            orderIndex: 2,
                            pointsReward: 100,
                            arMarkerType: ARMarkerType.IMAGE,
                        },
                    ],
                },
            },
        });

        await expect(
            publishHunt({ huntId: hunt.id, currentUserId: owner.id }),
        ).rejects.toThrow("HUNT_INVALID_STEP_ORDER");
    });
});