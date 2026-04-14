import { prisma } from "@/lib/db/prisma";
import {
    completeStep,
    finishParticipation,
    getTargetStepProgress,
    ParticipationError,
    startParticipation,
    useClue,
} from "@/lib/services/participation.service";
import { HuntStatus, HuntVisibility, ParticipationStatus, Role } from "@prisma/client";

jest.mock("@/lib/db/prisma", () => ({
    prisma: {
        $transaction: jest.fn(),
        participation: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        stepProgress: {
            update: jest.fn(),
        },
    },
}));

describe("participation.service - startParticipation", () => {
    it("should throw if a participation already exists for the same user and hunt", async () => {
        // Arrange
        const tx = {
            user: {
                findUnique: jest.fn().mockResolvedValue({
                    id: "user-1",
                    role: Role.PLAYER,
                }),
            },
            hunt: {
                findUnique: jest.fn().mockResolvedValue({
                    id: "hunt-1",
                    status: HuntStatus.PUBLISHED,
                    visibility: HuntVisibility.PUBLIC,
                    accessCode: null,
                    isDeleted: false,
                    steps: [{ id: "step-1", orderIndex: 0 }],
                }),
            },
            participation: {
                findUnique: jest.fn().mockResolvedValue({
                    id: "participation-1",
                    status: ParticipationStatus.IN_PROGRESS,
                    totalScore: 0,
                    startedAt: new Date(),
                    completedAt: null,
                    huntId: "hunt-1",
                    userId: "user-1",
                    hunt: {
                        id: "hunt-1",
                        title: "Test Hunt",
                        location: "Paris",
                        difficulty: "EASY",
                        bannerUrl: null,
                    },
                    stepProgress: [],
                }),
            },
            huntAccessAttempt: {
                findUnique: jest.fn().mockResolvedValue(null),
            },
        };

        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        mockedPrisma.$transaction.mockImplementation(async (callback) => {
            return callback(tx as never);
        });

        // Act + Assert
        await expect(
            startParticipation({
                userId: "user-1",
                huntId: "hunt-1",
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_ALREADY_EXISTS"));
    });
});

describe("participation.service - getTargetStepProgress", () => {
    it("should throw if the requested step is out of order", () => {
        // Arrange
        const participation = {
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 100,
                        clues: [],
                    },
                },
                {
                    stepId: "step-2",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 80,
                        clues: [],
                    },
                },
            ],
        };

        // Act + Assert
        expect(() =>
            getTargetStepProgress(participation, "step-2"),
        ).toThrow(new ParticipationError("STEP_OUT_OF_ORDER"));
    });

    it("should throw if participation is not in progress", () => {
        // Arrange
        const participation = {
            status: ParticipationStatus.COMPLETED,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 100,
                        clues: [],
                    },
                },
            ],
        };

        // Act + Assert
        expect(() =>
            getTargetStepProgress(participation, "step-1"),
        ).toThrow(new ParticipationError("PARTICIPATION_NOT_IN_PROGRESS"));
    });

    it("should throw if the requested step is not part of the participation", () => {
        // Arrange
        const participation = {
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 100,
                        clues: [],
                    },
                },
            ],
        };

        // Act + Assert
        expect(() =>
            getTargetStepProgress(participation, "step-999"),
        ).toThrow(new ParticipationError("STEP_NOT_IN_PARTICIPATION"));
    });

    it("should throw if the requested step is already completed", () => {
        // Arrange
        const participation = {
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: true,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 100,
                        clues: [],
                    },
                },
                {
                    stepId: "step-2",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 80,
                        clues: [],
                    },
                },
            ],
        };

        // Act + Assert
        expect(() =>
            getTargetStepProgress(participation, "step-1"),
        ).toThrow(new ParticipationError("STEP_ALREADY_COMPLETED"));
    });

    it("should throw if the requested step is misconfigured", () => {
        // Arrange
        const participation = {
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: null,
                },
            ],
        };

        // Act + Assert
        expect(() =>
            getTargetStepProgress(participation, "step-1"),
        ).toThrow(new ParticipationError("STEP_MISCONFIGURED"));
    });

    it("should return the requested step progress when it is the next expected step", () => {
        // Arrange
        const targetStepProgress = {
            stepId: "step-1",
            isCompleted: false,
            cluesUsed: 0,
            step: {
                pointsReward: 100,
                clues: [],
            },
        };

        const participation = {
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                targetStepProgress,
                {
                    stepId: "step-2",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 80,
                        clues: [],
                    },
                },
            ],
        };

        // Act
        const result = getTargetStepProgress(participation, "step-1");

        // Assert
        expect(result).toStrictEqual(targetStepProgress);
    });
});

describe("participation.service - useClue", () => {
    it("should return the next clue and increment cluesUsed", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock = mockedPrisma.participation.findUnique as jest.Mock;
        const stepProgressUpdateMock = mockedPrisma.stepProgress.update as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "user-1",
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 100,
                        clues: [
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
        });

        stepProgressUpdateMock.mockResolvedValue({
            cluesUsed: 1,
        });

        // Act
        const result = await useClue({
            participationId: "participation-1",
            userId: "user-1",
            stepId: "step-1",
        });

        // Assert
        expect(result).toStrictEqual({
            clue: {
                content: "Premier indice",
            },
            cluesUsed: 1,
            remainingClues: 1,
        });

        expect(participationFindUniqueMock).toHaveBeenCalledWith({
            where: { id: "participation-1" },
            select: expect.anything(),
        });

        expect(stepProgressUpdateMock).toHaveBeenCalledWith({
            where: {
                participationId_stepId: {
                    participationId: "participation-1",
                    stepId: "step-1",
                },
            },
            data: {
                cluesUsed: {
                    increment: 1,
                },
            },
            select: {
                cluesUsed: true,
            },
        });
    });

    it("should throw if participation is not found", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        participationFindUniqueMock.mockResolvedValue(null);

        // Act + Assert
        await expect(
            useClue({
                participationId: "participation-1",
                userId: "user-1",
                stepId: "step-1",
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_NOT_FOUND"));
    });

    it("should throw if participation does not belong to the user", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "other-user",
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 100,
                        clues: [
                            {
                                content: "Premier indice",
                                penaltyPoints: 10,
                                orderIndex: 0,
                            },
                        ],
                    },
                },
            ],
        });

        // Act + Assert
        await expect(
            useClue({
                participationId: "participation-1",
                userId: "user-1",
                stepId: "step-1",
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_FORBIDDEN"));
    });

    it("should throw if there are no more clues available", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "user-1",
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 2,
                    step: {
                        pointsReward: 100,
                        clues: [
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
        });

        // Act + Assert
        await expect(
            useClue({
                participationId: "participation-1",
                userId: "user-1",
                stepId: "step-1",
            }),
        ).rejects.toThrow(new ParticipationError("NO_MORE_CLUES_AVAILABLE"));
    });
});

describe("participation.service - completeStep", () => {
    it("should complete the step and add full points when no clue was used", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        const transactionMock =
            mockedPrisma.$transaction as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "user-1",
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 100,
                        clues: [
                            {
                                content: "Premier indice",
                                penaltyPoints: 10,
                                orderIndex: 0,
                            },
                        ],
                    },
                },
            ],
        });

        const tx = {
            stepProgress: {
                update: jest.fn().mockResolvedValue({}),
            },
            participation: {
                update: jest.fn().mockResolvedValue({
                    id: "participation-1",
                    totalScore: 100,
                }),
            },
        };

        transactionMock.mockImplementation(async (callback) => {
            return callback(tx);
        });

        // Act
        const result = await completeStep({
            participationId: "participation-1",
            userId: "user-1",
            stepId: "step-1",
        });

        // Assert
        expect(result).toStrictEqual({
            participationId: "participation-1",
            stepId: "step-1",
            pointsEarned: 100,
            totalScore: 100,
        });

        expect(participationFindUniqueMock).toHaveBeenCalledWith({
            where: { id: "participation-1" },
            select: expect.anything(),
        });

        expect(tx.stepProgress.update).toHaveBeenCalledWith({
            where: {
                participationId_stepId: {
                    participationId: "participation-1",
                    stepId: "step-1",
                },
            },
            data: {
                isCompleted: true,
                completedAt: expect.any(Date),
                pointsEarned: 100,
            },
        });

        expect(tx.participation.update).toHaveBeenCalledWith({
            where: { id: "participation-1" },
            data: {
                totalScore: {
                    increment: 100,
                },
            },
            select: {
                id: true,
                totalScore: true,
            },
        });
    });

    it("should apply clue penalties when completing a step", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        const transactionMock =
            mockedPrisma.$transaction as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "user-1",
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 2,
                    step: {
                        pointsReward: 100,
                        clues: [
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
            ],
        });

        const tx = {
            stepProgress: {
                update: jest.fn().mockResolvedValue({}),
            },
            participation: {
                update: jest.fn().mockResolvedValue({
                    id: "participation-1",
                    totalScore: 70,
                }),
            },
        };

        transactionMock.mockImplementation(async (callback) => {
            return callback(tx);
        });

        // Act
        const result = await completeStep({
            participationId: "participation-1",
            userId: "user-1",
            stepId: "step-1",
        });

        // Assert
        expect(result).toStrictEqual({
            participationId: "participation-1",
            stepId: "step-1",
            pointsEarned: 70,
            totalScore: 70,
        });

        expect(tx.stepProgress.update).toHaveBeenCalledWith({
            where: {
                participationId_stepId: {
                    participationId: "participation-1",
                    stepId: "step-1",
                },
            },
            data: {
                isCompleted: true,
                completedAt: expect.any(Date),
                pointsEarned: 70,
            },
        });

        expect(tx.participation.update).toHaveBeenCalledWith({
            where: { id: "participation-1" },
            data: {
                totalScore: {
                    increment: 70,
                },
            },
            select: {
                id: true,
                totalScore: true,
            },
        });
    });

    it("should clamp earned points to zero when penalties exceed reward", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        const transactionMock =
            mockedPrisma.$transaction as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "user-1",
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 2,
                    step: {
                        pointsReward: 15,
                        clues: [
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
        });

        const tx = {
            stepProgress: {
                update: jest.fn().mockResolvedValue({}),
            },
            participation: {
                update: jest.fn().mockResolvedValue({
                    id: "participation-1",
                    totalScore: 0,
                }),
            },
        };

        transactionMock.mockImplementation(async (callback) => {
            return callback(tx);
        });

        // Act
        const result = await completeStep({
            participationId: "participation-1",
            userId: "user-1",
            stepId: "step-1",
        });

        // Assert
        expect(result).toStrictEqual({
            participationId: "participation-1",
            stepId: "step-1",
            pointsEarned: 0,
            totalScore: 0,
        });

        expect(tx.stepProgress.update).toHaveBeenCalledWith({
            where: {
                participationId_stepId: {
                    participationId: "participation-1",
                    stepId: "step-1",
                },
            },
            data: {
                isCompleted: true,
                completedAt: expect.any(Date),
                pointsEarned: 0,
            },
        });

        expect(tx.participation.update).toHaveBeenCalledWith({
            where: { id: "participation-1" },
            data: {
                totalScore: {
                    increment: 0,
                },
            },
            select: {
                id: true,
                totalScore: true,
            },
        });
    });

    it("should throw if participation is not found", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        participationFindUniqueMock.mockResolvedValue(null);

        // Act + Assert
        await expect(
            completeStep({
                participationId: "participation-1",
                userId: "user-1",
                stepId: "step-1",
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_NOT_FOUND"));
    });

    it("should throw if participation does not belong to the user", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "other-user",
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 100,
                        clues: [],
                    },
                },
            ],
        });

        // Act + Assert
        await expect(
            completeStep({
                participationId: "participation-1",
                userId: "user-1",
                stepId: "step-1",
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_FORBIDDEN"));
    });

    it("should propagate step validation errors from getTargetStepProgress", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "user-1",
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 100,
                        clues: [],
                    },
                },
                {
                    stepId: "step-2",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 80,
                        clues: [],
                    },
                },
            ],
        });

        // Act + Assert
        await expect(
            completeStep({
                participationId: "participation-1",
                userId: "user-1",
                stepId: "step-2",
            }),
        ).rejects.toThrow(new ParticipationError("STEP_OUT_OF_ORDER"));
    });
});

describe("participation.service - finishParticipation", () => {
    it("should mark participation as completed when all steps are finished", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        const participationUpdateMock =
            mockedPrisma.participation.update as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "user-1",
            status: ParticipationStatus.IN_PROGRESS,
            totalScore: 150,
            startedAt: new Date("2026-01-01T10:00:00.000Z"),
            completedAt: null,
            huntId: "hunt-1",
            hunt: {
                id: "hunt-1",
                title: "Test Hunt",
                location: "Paris",
                difficulty: "EASY",
                bannerUrl: null,
            },
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: true,
                    cluesUsed: 1,
                    pointsEarned: 90,
                    completedAt: new Date("2026-01-01T10:10:00.000Z"),
                    step: {
                        id: "step-1",
                        title: "Step 1",
                        orderIndex: 0,
                        pointsReward: 100,
                    },
                },
                {
                    stepId: "step-2",
                    isCompleted: true,
                    cluesUsed: 0,
                    pointsEarned: 60,
                    completedAt: new Date("2026-01-01T10:20:00.000Z"),
                    step: {
                        id: "step-2",
                        title: "Step 2",
                        orderIndex: 1,
                        pointsReward: 60,
                    },
                },
            ],
        });

        const completedAt = new Date("2026-01-01T10:30:00.000Z");

        participationUpdateMock.mockResolvedValue({
            id: "participation-1",
            userId: "user-1",
            status: ParticipationStatus.COMPLETED,
            totalScore: 150,
            startedAt: new Date("2026-01-01T10:00:00.000Z"),
            completedAt,
            huntId: "hunt-1",
            hunt: {
                id: "hunt-1",
                title: "Test Hunt",
                location: "Paris",
                difficulty: "EASY",
                bannerUrl: null,
            },
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: true,
                    cluesUsed: 1,
                    pointsEarned: 90,
                    completedAt: new Date("2026-01-01T10:10:00.000Z"),
                    step: {
                        id: "step-1",
                        title: "Step 1",
                        orderIndex: 0,
                        pointsReward: 100,
                    },
                },
                {
                    stepId: "step-2",
                    isCompleted: true,
                    cluesUsed: 0,
                    pointsEarned: 60,
                    completedAt: new Date("2026-01-01T10:20:00.000Z"),
                    step: {
                        id: "step-2",
                        title: "Step 2",
                        orderIndex: 1,
                        pointsReward: 60,
                    },
                },
            ],
        });

        // Act
        const result = await finishParticipation({
            participationId: "participation-1",
            userId: "user-1",
        });

        // Assert
        expect(participationFindUniqueMock).toHaveBeenCalledWith({
            where: { id: "participation-1" },
            select: expect.anything(),
        });

        expect(participationUpdateMock).toHaveBeenCalledWith({
            where: { id: "participation-1" },
            data: {
                status: ParticipationStatus.COMPLETED,
                completedAt: expect.any(Date),
            },
            select: expect.anything(),
        });

        expect(result).toMatchObject({
            id: "participation-1",
            status: ParticipationStatus.COMPLETED,
            totalScore: 150,
            completedAt,
            hunt: {
                id: "hunt-1",
                title: "Test Hunt",
            },
        });

        expect(result.currentStep).toBeNull();
    });

    it("should throw if participation is not found", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        participationFindUniqueMock.mockResolvedValue(null);

        // Act + Assert
        await expect(
            finishParticipation({
                participationId: "participation-1",
                userId: "user-1",
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_NOT_FOUND"));
    });

    it("should throw if participation does not belong to the user", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "other-user",
            status: ParticipationStatus.IN_PROGRESS,
            totalScore: 150,
            startedAt: new Date("2026-01-01T10:00:00.000Z"),
            completedAt: null,
            huntId: "hunt-1",
            hunt: {
                id: "hunt-1",
                title: "Test Hunt",
                location: "Paris",
                difficulty: "EASY",
                bannerUrl: null,
            },
            stepProgress: [],
        });

        // Act + Assert
        await expect(
            finishParticipation({
                participationId: "participation-1",
                userId: "user-1",
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_FORBIDDEN"));
    });

    it("should throw if participation is not in progress", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "user-1",
            status: ParticipationStatus.COMPLETED,
            totalScore: 150,
            startedAt: new Date("2026-01-01T10:00:00.000Z"),
            completedAt: new Date("2026-01-01T10:30:00.000Z"),
            huntId: "hunt-1",
            hunt: {
                id: "hunt-1",
                title: "Test Hunt",
                location: "Paris",
                difficulty: "EASY",
                bannerUrl: null,
            },
            stepProgress: [],
        });

        // Act + Assert
        await expect(
            finishParticipation({
                participationId: "participation-1",
                userId: "user-1",
            }),
        ).rejects.toThrow(new ParticipationError("PARTICIPATION_NOT_IN_PROGRESS"));
    });

    it("should throw if participation still has remaining steps", async () => {
        // Arrange
        const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

        const participationFindUniqueMock =
            mockedPrisma.participation.findUnique as jest.Mock;

        participationFindUniqueMock.mockResolvedValue({
            id: "participation-1",
            userId: "user-1",
            status: ParticipationStatus.IN_PROGRESS,
            totalScore: 90,
            startedAt: new Date("2026-01-01T10:00:00.000Z"),
            completedAt: null,
            huntId: "hunt-1",
            hunt: {
                id: "hunt-1",
                title: "Test Hunt",
                location: "Paris",
                difficulty: "EASY",
                bannerUrl: null,
            },
            stepProgress: [
                {
                    stepId: "step-1",
                    isCompleted: true,
                    cluesUsed: 1,
                    pointsEarned: 90,
                    completedAt: new Date("2026-01-01T10:10:00.000Z"),
                    step: {
                        id: "step-1",
                        title: "Step 1",
                        orderIndex: 0,
                        pointsReward: 100,
                    },
                },
                {
                    stepId: "step-2",
                    isCompleted: false,
                    cluesUsed: 0,
                    pointsEarned: 0,
                    completedAt: null,
                    step: {
                        id: "step-2",
                        title: "Step 2",
                        orderIndex: 1,
                        pointsReward: 60,
                    },
                },
            ],
        });

        // Act + Assert
        await expect(
            finishParticipation({
                participationId: "participation-1",
                userId: "user-1",
            }),
        ).rejects.toThrow(
            new ParticipationError("PARTICIPATION_HAS_REMAINING_STEPS"),
        );
    });
});