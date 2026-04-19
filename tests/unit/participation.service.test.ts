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

beforeEach(() => {
    jest.clearAllMocks();
});

function getMockedPrisma() {
    return prisma as jest.Mocked<typeof prisma>;
}

function getParticipationFindUniqueMock() {
    return getMockedPrisma().participation.findUnique as jest.Mock;
}

function getParticipationUpdateMock() {
    return getMockedPrisma().participation.update as jest.Mock;
}

function getStepProgressUpdateMock() {
    return getMockedPrisma().stepProgress.update as jest.Mock;
}

function getTransactionMock() {
    return getMockedPrisma().$transaction as jest.Mock;
}

function makeClue(overrides = {}) {
    return {
        content: "Indice",
        penaltyPoints: 10,
        orderIndex: 0,
        ...overrides,
    };
}

function makeStepProgress(overrides = {}) {
    return {
        stepId: "step-1",
        isCompleted: false,
        cluesUsed: 0,
        pointsEarned: 0,
        completedAt: null,
        step: {
            id: "step-1",
            title: "Step 1",
            orderIndex: 0,
            pointsReward: 100,
            clues: [],
        },
        ...overrides,
    };
}

function makeParticipation(overrides = {}) {
    return {
        id: "participation-1",
        userId: "user-1",
        status: ParticipationStatus.IN_PROGRESS,
        totalScore: 0,
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
        ...overrides,
    };
}

function mockTransaction(tx: unknown) {
    getTransactionMock().mockImplementation(async (callback: (tx: unknown) => unknown) => {
        return callback(tx);
    });
}

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
                findUnique: jest.fn().mockResolvedValue(
                    makeParticipation({
                        status: ParticipationStatus.IN_PROGRESS,
                        huntId: "hunt-1",
                        userId: "user-1",
                    }),
                ),
            },
            huntAccessAttempt: {
                findUnique: jest.fn().mockResolvedValue(null),
            },
        };

        mockTransaction(tx);

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
        const participation = makeParticipation({
            stepProgress: [
                makeStepProgress({
                    stepId: "step-1",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 100,
                        clues: [],
                    },
                }),
                makeStepProgress({
                    stepId: "step-2",
                    isCompleted: false,
                    cluesUsed: 0,
                    step: {
                        pointsReward: 80,
                        clues: [],
                    },
                }),
            ],
        });

        // Act + Assert
        expect(() =>
            getTargetStepProgress(participation, "step-2"),
        ).toThrow(new ParticipationError("STEP_OUT_OF_ORDER"));
    });

    it("should throw if participation is not in progress", () => {
        // Arrange
        const participation = makeParticipation({
            status: ParticipationStatus.COMPLETED,
            stepProgress: [makeStepProgress()],
        });

        // Act + Assert
        expect(() =>
            getTargetStepProgress(participation, "step-1"),
        ).toThrow(new ParticipationError("PARTICIPATION_NOT_IN_PROGRESS"));
    });

    it("should throw if the requested step is not part of the participation", () => {
        // Arrange
        const participation = makeParticipation({
            stepProgress: [makeStepProgress()],
        });

        // Act + Assert
        expect(() =>
            getTargetStepProgress(participation, "step-999"),
        ).toThrow(new ParticipationError("STEP_NOT_IN_PARTICIPATION"));
    });

    it("should throw if the requested step is already completed", () => {
        // Arrange
        const participation = makeParticipation({
            stepProgress: [
                makeStepProgress({
                    stepId: "step-1",
                    isCompleted: true,
                }),
                makeStepProgress({
                    stepId: "step-2",
                    isCompleted: false,
                    step: {
                        pointsReward: 80,
                        clues: [],
                    },
                }),
            ],
        });

        // Act + Assert
        expect(() =>
            getTargetStepProgress(participation, "step-1"),
        ).toThrow(new ParticipationError("STEP_ALREADY_COMPLETED"));
    });

    it("should throw if the requested step is misconfigured", () => {
        // Arrange
        const participation = makeParticipation({
            stepProgress: [
                makeStepProgress({
                    stepId: "step-1",
                    step: null,
                }),
            ],
        });

        // Act + Assert
        expect(() =>
            getTargetStepProgress(participation, "step-1"),
        ).toThrow(new ParticipationError("STEP_MISCONFIGURED"));
    });

    it("should return the requested step progress when it is the next expected step", () => {
        // Arrange
        const targetStepProgress = makeStepProgress({
            stepId: "step-1",
        });

        const participation = makeParticipation({
            stepProgress: [
                targetStepProgress,
                makeStepProgress({
                    stepId: "step-2",
                    step: {
                        pointsReward: 80,
                        clues: [],
                    },
                }),
            ],
        });

        // Act
        const result = getTargetStepProgress(participation, "step-1");

        // Assert
        expect(result).toStrictEqual(targetStepProgress);
    });
});

describe("participation.service - useClue", () => {
    it("should return the next clue and increment cluesUsed", async () => {
        // Arrange
        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                stepProgress: [
                    makeStepProgress({
                        cluesUsed: 0,
                        step: {
                            pointsReward: 100,
                            clues: [
                                makeClue({ content: "Premier indice", orderIndex: 0 }),
                                makeClue({ content: "Deuxième indice", orderIndex: 1 }),
                            ],
                        },
                    }),
                ],
            }),
        );

        getStepProgressUpdateMock().mockResolvedValue({
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

        expect(getParticipationFindUniqueMock()).toHaveBeenCalledWith({
            where: { id: "participation-1" },
            select: expect.anything(),
        });

        expect(getStepProgressUpdateMock()).toHaveBeenCalledWith({
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
        getParticipationFindUniqueMock().mockResolvedValue(null);

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
        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                userId: "other-user",
                stepProgress: [
                    makeStepProgress({
                        step: {
                            pointsReward: 100,
                            clues: [makeClue()],
                        },
                    }),
                ],
            }),
        );

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
        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                stepProgress: [
                    makeStepProgress({
                        cluesUsed: 2,
                        step: {
                            pointsReward: 100,
                            clues: [
                                makeClue({ orderIndex: 0 }),
                                makeClue({ orderIndex: 1 }),
                            ],
                        },
                    }),
                ],
            }),
        );

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
        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                stepProgress: [
                    makeStepProgress({
                        cluesUsed: 0,
                        step: {
                            id: "step-1",
                            title: "Step 1",
                            orderIndex: 0,
                            pointsReward: 100,
                            clues: [makeClue()],
                        },
                    }),
                ],
            }),
        );

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

        mockTransaction(tx);

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
        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                stepProgress: [
                    makeStepProgress({
                        cluesUsed: 2,
                        step: {
                            id: "step-1",
                            title: "Step 1",
                            orderIndex: 0,
                            pointsReward: 100,
                            clues: [
                                makeClue({ penaltyPoints: 10, orderIndex: 0 }),
                                makeClue({ penaltyPoints: 20, orderIndex: 1 }),
                                makeClue({ penaltyPoints: 30, orderIndex: 2 }),
                            ],
                        },
                    }),
                ],
            }),
        );

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

        mockTransaction(tx);

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
        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                stepProgress: [
                    makeStepProgress({
                        cluesUsed: 2,
                        step: {
                            id: "step-1",
                            title: "Step 1",
                            orderIndex: 0,
                            pointsReward: 15,
                            clues: [
                                makeClue({ penaltyPoints: 10, orderIndex: 0 }),
                                makeClue({ penaltyPoints: 20, orderIndex: 1 }),
                            ],
                        },
                    }),
                ],
            }),
        );

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

        mockTransaction(tx);

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
        getParticipationFindUniqueMock().mockResolvedValue(null);

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
        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                userId: "other-user",
                stepProgress: [makeStepProgress()],
            }),
        );

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
        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                stepProgress: [
                    makeStepProgress({
                        stepId: "step-1",
                        isCompleted: false,
                    }),
                    makeStepProgress({
                        stepId: "step-2",
                        isCompleted: false,
                        step: {
                            id: "step-2",
                            title: "Step 2",
                            orderIndex: 1,
                            pointsReward: 80,
                            clues: [],
                        },
                    }),
                ],
            }),
        );

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
        const completedAt = new Date("2026-01-01T10:30:00.000Z");

        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                totalScore: 150,
                stepProgress: [
                    makeStepProgress({
                        stepId: "step-1",
                        isCompleted: true,
                        cluesUsed: 1,
                        pointsEarned: 90,
                        completedAt: new Date("2026-01-01T10:10:00.000Z"),
                    }),
                    makeStepProgress({
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
                            clues: [],
                        },
                    }),
                ],
            }),
        );

        getParticipationUpdateMock().mockResolvedValue(
            makeParticipation({
                status: ParticipationStatus.COMPLETED,
                totalScore: 150,
                completedAt,
                stepProgress: [
                    makeStepProgress({
                        stepId: "step-1",
                        isCompleted: true,
                        cluesUsed: 1,
                        pointsEarned: 90,
                        completedAt: new Date("2026-01-01T10:10:00.000Z"),
                    }),
                    makeStepProgress({
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
                            clues: [],
                        },
                    }),
                ],
            }),
        );

        // Act
        const result = await finishParticipation({
            participationId: "participation-1",
            userId: "user-1",
        });

        // Assert
        expect(getParticipationFindUniqueMock()).toHaveBeenCalledWith({
            where: { id: "participation-1" },
            select: expect.anything(),
        });

        expect(getParticipationUpdateMock()).toHaveBeenCalledWith({
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
        getParticipationFindUniqueMock().mockResolvedValue(null);

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
        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                userId: "other-user",
            }),
        );

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
        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                status: ParticipationStatus.COMPLETED,
                completedAt: new Date("2026-01-01T10:30:00.000Z"),
            }),
        );

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
        getParticipationFindUniqueMock().mockResolvedValue(
            makeParticipation({
                totalScore: 90,
                stepProgress: [
                    makeStepProgress({
                        stepId: "step-1",
                        isCompleted: true,
                        cluesUsed: 1,
                        pointsEarned: 90,
                        completedAt: new Date("2026-01-01T10:10:00.000Z"),
                    }),
                    makeStepProgress({
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
                            clues: [],
                        },
                    }),
                ],
            }),
        );

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