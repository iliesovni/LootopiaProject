import { prisma } from "@/lib/db/prisma";
import {
    completeStep,
    finishParticipation,
    ParticipationError,
    startParticipation,
} from "@/lib/services/participation.service";
import {
    ARMarkerType,
    Difficulty,
    HuntMode,
    HuntStatus,
    HuntVisibility,
    ParticipationStatus,
    Role,
} from "@prisma/client";

describe("integration - finishParticipation", () => {
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
                title: `Finish Hunt ${ unique }`,
                description: "Hunt créée pour test d'intégration finishParticipation",
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

    it("should mark participation as completed when all steps are completed", async () => {
        // Arrange
        const unique = `finish-ok-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        const participation = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        await completeStep({
            participationId: participation.id,
            userId: player.id,
            stepId: hunt.steps[0].id,
        });

        await completeStep({
            participationId: participation.id,
            userId: player.id,
            stepId: hunt.steps[1].id,
        });

        // Act
        const result = await finishParticipation({
            participationId: participation.id,
            userId: player.id,
        });

        // Assert — retour du service
        expect(result.id).toBe(participation.id);
        expect(result.status).toBe(ParticipationStatus.COMPLETED);
        expect(result.currentStep).toBeNull();
        expect(result.totalScore).toBe(180);

        // Assert — état réel en base
        const finishedParticipation = await prisma.participation.findUnique({
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

        expect(finishedParticipation).not.toBeNull();
        expect(finishedParticipation?.status).toBe(ParticipationStatus.COMPLETED);
        expect(finishedParticipation?.completedAt).not.toBeNull();
        expect(finishedParticipation?.totalScore).toBe(180);

        expect(finishedParticipation?.stepProgress[0]).toMatchObject({
            stepId: hunt.steps[0].id,
            isCompleted: true,
            pointsEarned: 100,
        });

        expect(finishedParticipation?.stepProgress[1]).toMatchObject({
            stepId: hunt.steps[1].id,
            isCompleted: true,
            pointsEarned: 80,
        });
    });

    it("should throw if participation still has remaining steps", async () => {
        // Arrange
        const unique = `finish-remaining-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        const participation = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        await completeStep({
            participationId: participation.id,
            userId: player.id,
            stepId: hunt.steps[0].id,
        });

        // Act + Assert
        await expect(
            finishParticipation({
                participationId: participation.id,
                userId: player.id,
            }),
        ).rejects.toThrow(
            new ParticipationError("PARTICIPATION_HAS_REMAINING_STEPS"),
        );

        const unchangedParticipation = await prisma.participation.findUnique({
            where: { id: participation.id },
        });

        expect(unchangedParticipation?.status).toBe(ParticipationStatus.IN_PROGRESS);
        expect(unchangedParticipation?.completedAt).toBeNull();
        expect(unchangedParticipation?.totalScore).toBe(100);
    });

    it("should throw if participation is not in progress", async () => {
        // Arrange
        const unique = `finish-status-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        const participation = await startParticipation({
            userId: player.id,
            huntId: hunt.id,
        });

        await completeStep({
            participationId: participation.id,
            userId: player.id,
            stepId: hunt.steps[0].id,
        });

        await completeStep({
            participationId: participation.id,
            userId: player.id,
            stepId: hunt.steps[1].id,
        });

        await finishParticipation({
            participationId: participation.id,
            userId: player.id,
        });

        // Act + Assert
        await expect(
            finishParticipation({
                participationId: participation.id,
                userId: player.id,
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_NOT_IN_PROGRESS"));
    });

    it("should throw if trying to finish another user's participation", async () => {
        // Arrange
        const unique = `finish-forbidden-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`);
        const otherUser = await createUser(`other-${ unique }`);
        const hunt = await createPublishedHunt(unique);

        const participation = await startParticipation({
            userId: owner.id,
            huntId: hunt.id,
        });

        await completeStep({
            participationId: participation.id,
            userId: owner.id,
            stepId: hunt.steps[0].id,
        });

        await completeStep({
            participationId: participation.id,
            userId: owner.id,
            stepId: hunt.steps[1].id,
        });

        // Act + Assert
        await expect(
            finishParticipation({
                participationId: participation.id,
                userId: otherUser.id,
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_FORBIDDEN"));

        const unchangedParticipation = await prisma.participation.findUnique({
            where: { id: participation.id },
        });

        expect(unchangedParticipation?.status).toBe(ParticipationStatus.IN_PROGRESS);
        expect(unchangedParticipation?.completedAt).toBeNull();
        expect(unchangedParticipation?.totalScore).toBe(180);
    });

    it("should throw if participation is not found", async () => {
        // Arrange
        const unique = `finish-not-found-${ Date.now() }`;
        const player = await createUser(`player-${ unique }`);

        // Act + Assert
        await expect(
            finishParticipation({
                participationId: "00000000-0000-0000-0000-000000000000",
                userId: player.id,
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_NOT_FOUND"));
    });
});