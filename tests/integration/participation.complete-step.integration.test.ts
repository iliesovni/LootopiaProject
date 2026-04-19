import { prisma } from "@/lib/db/prisma";
import { completeStep, ParticipationError, startParticipation, useClue } from "@/lib/services/participation.service";
import {
    ARMarkerType,
    Difficulty,
    HuntMode,
    HuntStatus,
    HuntVisibility,
    ParticipationStatus,
    Role,
} from "@prisma/client";

describe("integration - completeStep", () => {
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
                title: `Integration Hunt ${ unique }`,
                description: "Hunt créée pour test d'intégration completeStep",
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
                                    {
                                        content: "Troisième indice",
                                        penaltyPoints: 30,
                                        orderIndex: 2,
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

    it("should complete the current step and apply clue penalties to the score", async () => {
        // Arrange
        const unique = `complete-step-${ Date.now() }`;
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

        // Act
        const result = await completeStep({
            participationId: participation.id,
            userId: player.id,
            stepId: firstStepId,
        });

        // Assert — retour du service
        expect(result).toStrictEqual({
            participationId: participation.id,
            stepId: firstStepId,
            pointsEarned: 70,
            totalScore: 70,
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
                    include: {
                        step: true,
                    },
                },
            },
        });

        expect(updatedParticipation).not.toBeNull();
        expect(updatedParticipation?.status).toBe(ParticipationStatus.IN_PROGRESS);
        expect(updatedParticipation?.totalScore).toBe(70);

        expect(updatedParticipation?.stepProgress).toHaveLength(2);

        expect(updatedParticipation?.stepProgress[0]).toMatchObject({
            stepId: firstStepId,
            isCompleted: true,
            cluesUsed: 2,
            pointsEarned: 70,
        });
        expect(updatedParticipation?.stepProgress[0].completedAt).not.toBeNull();

        expect(updatedParticipation?.stepProgress[1]).toMatchObject({
            stepId: hunt.steps[1].id,
            isCompleted: false,
            cluesUsed: 0,
            pointsEarned: 0,
        });
    });

    it("should clamp earned points to zero when clue penalties exceed reward", async () => {
        // Arrange
        const unique = `complete-step-zero-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const creator = await createUser(`creator-low-${ unique }`);

        const hunt = await prisma.hunt.create({
            data: {
                title: `Low Reward Hunt ${ unique }`,
                description: "Hunt pour tester le score minimum à 0",
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
                            pointsReward: 15,
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

        // Act
        const result = await completeStep({
            participationId: participation.id,
            userId: player.id,
            stepId: firstStepId,
        });

        // Assert — retour du service
        expect(result).toStrictEqual({
            participationId: participation.id,
            stepId: firstStepId,
            pointsEarned: 0,
            totalScore: 0,
        });

        // Assert — état réel en base
        const updatedParticipation = await prisma.participation.findUnique({
            where: { id: participation.id },
            include: {
                stepProgress: {
                    include: {
                        step: true,
                    },
                },
            },
        });

        expect(updatedParticipation).not.toBeNull();
        expect(updatedParticipation?.totalScore).toBe(0);

        const firstStepProgress = updatedParticipation?.stepProgress.find(
            (progress) => progress.stepId === firstStepId,
        );

        expect(firstStepProgress).toMatchObject({
            stepId: firstStepId,
            isCompleted: true,
            cluesUsed: 2,
            pointsEarned: 0,
        });
        expect(firstStepProgress?.completedAt).not.toBeNull();
    });

    it("should throw if trying to complete a step out of order", async () => {
        // Arrange
        const unique = `complete-step-order-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        const participation = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        const secondStepId = hunt.steps[1].id;

        // Act + Assert
        await expect(
            completeStep({
                participationId: participation.id,
                userId: player.id,
                stepId: secondStepId,
            }),
        ).rejects.toThrow(new ParticipationError("STEP_OUT_OF_ORDER"));

        // Assert — vérifier qu’aucune step n’a été complétée par erreur
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

    it("should throw if trying to complete a participation that belongs to another user", async () => {
        // Arrange
        const unique = `complete-step-forbidden-${ Date.now() }`;
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
            completeStep({
                participationId: participation.id,
                userId: otherUser.id,
                stepId: firstStepId,
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_FORBIDDEN"));

        // Assert — vérifier qu’aucune modification n’a eu lieu
        const unchangedParticipation = await prisma.participation.findUnique({
            where: { id: participation.id },
            include: {
                stepProgress: true,
            },
        });

        expect(unchangedParticipation?.status).toBe(ParticipationStatus.IN_PROGRESS);
        expect(unchangedParticipation?.totalScore).toBe(0);

        const firstStepProgress = unchangedParticipation?.stepProgress.find(
            (progress) => progress.stepId === firstStepId,
        );

        expect(firstStepProgress).toMatchObject({
            isCompleted: false,
            cluesUsed: 0,
            pointsEarned: 0,
        });
        expect(firstStepProgress?.completedAt).toBeNull();
    });
});