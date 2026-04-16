import { prisma } from "@/lib/db/prisma";
import { ParticipationError, startParticipation, useClue } from "@/lib/services/participation.service";
import {
    ARMarkerType,
    Difficulty,
    HuntMode,
    HuntStatus,
    HuntVisibility,
    ParticipationStatus,
    Role,
} from "@prisma/client";

describe("integration - useClue", () => {
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

    async function createPublishedHunt(unique: string) {
        const creator = await createUser(`creator-${ unique }`);

        return prisma.hunt.create({
            data: {
                title: `UseClue Hunt ${ unique }`,
                description: "Hunt créée pour test d'intégration useClue",
                location: "Paris",
                difficulty: Difficulty.EASY,
                startLat: 48.8566,
                startLng: 2.3522,
                createdById: creator.id,
                mode: HuntMode.COMMUNITY,
                status: HuntStatus.PUBLISHED,
                visibility: HuntVisibility.PUBLIC,
                isDeleted: false,
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
                                    {
                                        content: "Deuxième indice",
                                        penaltyPoints: 20,
                                        orderIndex: 1,
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
                    include: {
                        clues: {
                            orderBy: {
                                orderIndex: "asc",
                            },
                        },
                    },
                },
            },
        });
    }

    it("should return the next clue and increment cluesUsed", async () => {
        // Arrange
        const unique = `use-clue-ok-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        const participation = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        const firstStepId = hunt.steps[0].id;

        // Act
        const result = await useClue({
            participationId: participation.id,
            userId: player.id,
            stepId: firstStepId,
        });

        // Assert — retour du service
        expect(result).toStrictEqual({
            clue: {
                content: "Premier indice",
            },
            cluesUsed: 1,
            remainingClues: 1,
        });

        // Assert — état réel en base
        const updatedParticipation = await prisma.participation.findUnique({
            where: { id: participation.id },
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

        expect(updatedParticipation).not.toBeNull();
        expect(updatedParticipation?.status).toBe(ParticipationStatus.IN_PROGRESS);

        const firstStepProgress = updatedParticipation?.stepProgress[0];
        expect(firstStepProgress).toMatchObject({
            stepId: firstStepId,
            isCompleted: false,
            cluesUsed: 1,
            pointsEarned: 0,
        });
    });

    it("should return the second clue on the second use", async () => {
        // Arrange
        const unique = `use-clue-second-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        const participation = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        const firstStepId = hunt.steps[0].id;

        await useClue({
            participationId: participation.id,
            userId: player.id,
            stepId: firstStepId,
        });

        // Act
        const result = await useClue({
            participationId: participation.id,
            userId: player.id,
            stepId: firstStepId,
        });

        // Assert
        expect(result).toStrictEqual({
            clue: {
                content: "Deuxième indice",
            },
            cluesUsed: 2,
            remainingClues: 0,
        });

        const updatedParticipation = await prisma.participation.findUnique({
            where: { id: participation.id },
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

        const firstStepProgress = updatedParticipation?.stepProgress[0];
        expect(firstStepProgress).toMatchObject({
            stepId: firstStepId,
            isCompleted: false,
            cluesUsed: 2,
            pointsEarned: 0,
        });
    });

    it("should throw if there are no more clues available", async () => {
        // Arrange
        const unique = `use-clue-none-left-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        const participation = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        const firstStepId = hunt.steps[0].id;

        await useClue({
            participationId: participation.id,
            userId: player.id,
            stepId: firstStepId,
        });

        await useClue({
            participationId: participation.id,
            userId: player.id,
            stepId: firstStepId,
        });

        // Act + Assert
        await expect(
            useClue({
                participationId: participation.id,
                userId: player.id,
                stepId: firstStepId,
            }),
        ).rejects.toThrow(new ParticipationError("NO_MORE_CLUES_AVAILABLE"));

        const updatedParticipation = await prisma.participation.findUnique({
            where: { id: participation.id },
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

        const firstStepProgress = updatedParticipation?.stepProgress[0];
        expect(firstStepProgress).toMatchObject({
            stepId: firstStepId,
            isCompleted: false,
            cluesUsed: 2,
            pointsEarned: 0,
        });
    });

    it("should throw if trying to use a clue on a step out of order", async () => {
        // Arrange
        const unique = `use-clue-order-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        const participation = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        const secondStepId = hunt.steps[1].id;

        // Act + Assert
        await expect(
            useClue({
                participationId: participation.id,
                userId: player.id,
                stepId: secondStepId,
            }),
        ).rejects.toThrow(new ParticipationError("STEP_OUT_OF_ORDER"));

        const unchangedParticipation = await prisma.participation.findUnique({
            where: { id: participation.id },
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

        expect(unchangedParticipation?.totalScore).toBe(0);
        expect(unchangedParticipation?.stepProgress[0]).toMatchObject({
            isCompleted: false,
            cluesUsed: 0,
            pointsEarned: 0,
        });
        expect(unchangedParticipation?.stepProgress[1]).toMatchObject({
            isCompleted: false,
            cluesUsed: 0,
            pointsEarned: 0,
        });
    });

    it("should throw if trying to use a clue on another user's participation", async () => {
        // Arrange
        const unique = `use-clue-forbidden-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`);
        const otherUser = await createUser(`other-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        const participation = await startParticipation({
            userId: owner.id,
            huntId: hunt.id,
        });

        const firstStepId = hunt.steps[0].id;

        // Act + Assert
        await expect(
            useClue({
                participationId: participation.id,
                userId: otherUser.id,
                stepId: firstStepId,
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_FORBIDDEN"));

        const unchangedParticipation = await prisma.participation.findUnique({
            where: { id: participation.id },
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

        const firstStepProgress = unchangedParticipation?.stepProgress[0];
        expect(firstStepProgress).toMatchObject({
            isCompleted: false,
            cluesUsed: 0,
            pointsEarned: 0,
        });
    });
});