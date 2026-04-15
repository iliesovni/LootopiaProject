import { prisma } from "@/lib/db/prisma";
import { ParticipationError, startParticipation } from "@/lib/services/participation.service";
import {
    ARMarkerType,
    Difficulty,
    HuntMode,
    HuntStatus,
    HuntVisibility,
    ParticipationStatus,
    Role,
} from "@prisma/client";

describe("integration - startParticipation", () => {
    async function createPublishedHunt(unique: string, overrides?: Partial<{
        status: HuntStatus;
        visibility: HuntVisibility;
        isDeleted: boolean;
        accessCode: string | null;
        isPublic: boolean;
    }>) {
        const creator = await prisma.user.create({
            data: {
                email: `creator-${ unique }@integration.local`,
                username: `creator-${ unique }`,
                passwordHash: "hashed-password",
                role: Role.PLAYER,
            },
        });

        return prisma.hunt.create({
            data: {
                title: `Integration Hunt ${ unique }`,
                description: "Hunt créée pour test d'intégration",
                location: "Paris",
                difficulty: Difficulty.EASY,
                isPublic: overrides?.isPublic ?? true,
                startLat: 48.8566,
                startLng: 2.3522,
                createdById: creator.id,
                mode: HuntMode.COMMUNITY,
                status: overrides?.status ?? HuntStatus.PUBLISHED,
                visibility: overrides?.visibility ?? HuntVisibility.PUBLIC,
                isDeleted: overrides?.isDeleted ?? false,
                accessCode: overrides?.accessCode ?? null,
                steps: {
                    create: [
                        {
                            title: "Step 1",
                            description: "Première étape",
                            latitude: 48.8566,
                            longitude: 2.3522,
                            radiusMeters: 50,
                            orderIndex: 0,
                            pointsReward: 100,
                            arMarkerType: ARMarkerType.IMAGE,
                            clues: {
                                create: [
                                    {
                                        content: "Premier indice",
                                        penaltyPoints: 10,
                                        orderIndex: 0,
                                    },
                                ],
                            },
                        },
                        {
                            title: "Step 2",
                            description: "Deuxième étape",
                            latitude: 48.857,
                            longitude: 2.353,
                            radiusMeters: 50,
                            orderIndex: 1,
                            pointsReward: 80,
                            arMarkerType: ARMarkerType.IMAGE,
                        },
                    ],
                },
            },
            include: {
                steps: {
                    orderBy: {
                        orderIndex: "asc",
                    },
                },
            },
        });
    }

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

    it("should create a participation with step progress for a published public hunt", async () => {
        // Arrange
        const unique = `start-ok-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        // Act
        const result = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        // Assert — retour du service
        expect(result.status).toBe(ParticipationStatus.IN_PROGRESS);
        expect(result.userId).toBe(player.id);
        expect(result.huntId).toBe(hunt.id);
        expect(result.totalScore).toBe(0);
        expect(result.currentStep).not.toBeNull();
        expect(result.currentStep?.stepId).toBe(hunt.steps[0].id);
        expect(result.completedSteps).toHaveLength(0);

        // Assert — état réel en base
        const createdParticipation = await prisma.participation.findUnique({
            where: {
                userId_huntId: {
                    userId: player.id,
                    huntId: hunt.id,
                },
            },
            include: {
                stepProgress: {
                    orderBy: {
                        step: {
                            orderIndex: "asc",
                        },
                    },
                },
            },
        });

        expect(createdParticipation).not.toBeNull();
        expect(createdParticipation?.status).toBe(ParticipationStatus.IN_PROGRESS);
        expect(createdParticipation?.totalScore).toBe(0);
        expect(createdParticipation?.stepProgress).toHaveLength(2);

        expect(createdParticipation?.stepProgress[0]).toMatchObject({
            stepId: hunt.steps[0].id,
            isCompleted: false,
            cluesUsed: 0,
            pointsEarned: 0,
        });

        expect(createdParticipation?.stepProgress[1]).toMatchObject({
            stepId: hunt.steps[1].id,
            isCompleted: false,
            cluesUsed: 0,
            pointsEarned: 0,
        });
    });

    it("should throw if the user is not a player", async () => {
        // Arrange
        const unique = `start-role-${ Date.now() }`;
        const partnerUser = await createUser(`partner-${ unique }`, Role.PARTNER);
        const hunt = await createPublishedHunt(unique);

        // Act + Assert
        await expect(
            startParticipation({
                userId: partnerUser.id,
                huntId: hunt.id,
            }),
        ).rejects.toThrow(new ParticipationError("USER_NOT_PLAYER"));
    });

    it("should throw if the hunt is not published", async () => {
        // Arrange
        const unique = `start-draft-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique, {
            status: HuntStatus.DRAFT,
        });

        // Act + Assert
        await expect(
            startParticipation({
                userId: player.id,
                huntId: hunt.id,
            }),
        ).rejects.toThrow(new ParticipationError("HUNT_NOT_PUBLISHED"));
    });

    it("should throw if a participation already exists for the same user and hunt", async () => {
        // Arrange
        const unique = `start-duplicate-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        // Act + Assert
        await expect(
            startParticipation({
                userId: player.id,
                huntId: hunt.id,
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_ALREADY_EXISTS"));
    });

    it("should throw if a private hunt is started without access code", async () => {
        // Arrange
        const unique = `start-private-missing-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique, {
            visibility: HuntVisibility.PRIVATE,
            accessCode: "12345678",
            isPublic: false,
        });

        // Act + Assert
        await expect(
            startParticipation({
                userId: player.id,
                huntId: hunt.id,
            }),
        ).rejects.toThrow(new ParticipationError("ACCESS_CODE_REQUIRED"));
    });

    it("should start a private hunt with the correct access code", async () => {
        // Arrange
        const unique = `start-private-ok-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique, {
            visibility: HuntVisibility.PRIVATE,
            accessCode: "12345678",
            isPublic: false,
        });

        // Act
        const result = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
            accessCode: "12345678",
        });

        // Assert
        expect(result.status).toBe(ParticipationStatus.IN_PROGRESS);
        expect(result.userId).toBe(player.id);
        expect(result.huntId).toBe(hunt.id);

        const createdParticipation = await prisma.participation.findUnique({
            where: {
                userId_huntId: {
                    userId: player.id,
                    huntId: hunt.id,
                },
            },
        });

        expect(createdParticipation).not.toBeNull();
        expect(createdParticipation?.status).toBe(ParticipationStatus.IN_PROGRESS);
    });

    it("should resume an abandoned participation instead of creating a new one", async () => {
        // Arrange
        const unique = `start-abandoned-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        const firstStart = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        await prisma.participation.update({
            where: { id: firstStart.id },
            data: {
                status: ParticipationStatus.ABANDONED,
            },
        });

        // Act
        const resumed = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        // Assert
        expect(resumed.id).toBe(firstStart.id);
        expect(resumed.status).toBe(ParticipationStatus.IN_PROGRESS);

        const participations = await prisma.participation.findMany({
            where: {
                userId: player.id,
                huntId: hunt.id,
            },
        });

        expect(participations).toHaveLength(1);
        expect(participations[0].id).toBe(firstStart.id);
        expect(participations[0].status).toBe(ParticipationStatus.IN_PROGRESS);
    });
});