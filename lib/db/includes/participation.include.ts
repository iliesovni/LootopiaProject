import { Prisma } from "@prisma/client";

export const participationPublicSelect = {
    id: true,
    status: true,
    totalScore: true,
    startedAt: true,
    completedAt: true,
    huntId: true,
    userId: true,
    hunt: {
        select: {
            id: true,
            title: true,
            location: true,
            difficulty: true,
            bannerUrl: true,
        },
    },
    stepProgress: {
        orderBy: {
            step: {
                orderIndex: "asc" as const,
            },
        },
        select: {
            stepId: true,
            isCompleted: true,
            cluesUsed: true,
            pointsEarned: true,
            completedAt: true,
            step: {
                select: {
                    id: true,
                    title: true,
                    orderIndex: true,
                    pointsReward: true,
                },
            },
        },
    },
} satisfies Prisma.ParticipationSelect;

export const participationProgressInternalSelect = {
    id: true,
    userId: true,
    huntId: true,
    status: true,
    totalScore: true,
    startedAt: true,
    completedAt: true,
    hunt: {
        select: {
            id: true,
            title: true,
            location: true,
            difficulty: true,
        },
    },
    stepProgress: {
        orderBy: {
            step: {
                orderIndex: "asc" as const,
            },
        },
        select: {
            stepId: true,
            isCompleted: true,
            cluesUsed: true,
            pointsEarned: true,
            completedAt: true,
            step: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    latitude: true,
                    longitude: true,
                    radiusMeters: true,
                    orderIndex: true,
                    pointsReward: true,
                    arMarkerType: true,
                    arAssetUrl: true,
                    clues: {
                        orderBy: {
                            orderIndex: "asc" as const,
                        },
                        select: {
                            id: true,
                            content: true,
                            penaltyPoints: true,
                            orderIndex: true,
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.ParticipationSelect;

