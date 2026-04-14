import { prisma } from "@/lib/db/prisma";
import { getTargetStepProgress, ParticipationError, startParticipation } from "@/lib/services/participation.service";
import { HuntStatus, HuntVisibility, ParticipationStatus, Role } from "@prisma/client";

jest.mock("@/lib/db/prisma", () => ({
    prisma: {
        $transaction: jest.fn(),
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