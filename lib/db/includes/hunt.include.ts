import { Prisma } from "@prisma/client";

export const huntPublicListSelect = {
    id: true,
    title: true,
    description: true,
    location: true,
    difficulty: true,
    bannerUrl: true,
    createdAt: true,
    startLat: true,
    startLng: true,
    createdBy: {
        select: {
            username: true,
        },
    },
    _count: {
        select: {
            steps: true,
        },
    },
} satisfies Prisma.HuntSelect;

export const huntPublicDetailSelect = {
    id: true,
    title: true,
    description: true,
    location: true,
    difficulty: true,
    bannerUrl: true,
    createdAt: true,
    startLat: true,
    startLng: true,
    createdBy: {
        select: {
            username: true,
        },
    },
    _count: {
        select: {
            steps: true,
        },
    },
} satisfies Prisma.HuntSelect;

export const huntOwnerDetailSelect = {
    id: true,
    title: true,
    description: true,
    location: true,
    difficulty: true,
    bannerUrl: true,
    mode: true,
    status: true,
    visibility: true,
    accessCode: true,
    isDeleted: true,
    createdById: true,
    partnerId: true,
    startLat: true,
    startLng: true,
    createdBy: {
        select: {
            id: true,
            username: true,
            role: true,
        },
    },
    steps: {
        orderBy: {
            orderIndex: "asc",
        },
        select: {
            id: true,
            title: true,
            description: true,
            latitude: true,
            longitude: true,
            radiusMeters: true,
            pointsReward: true,
            orderIndex: true,
            clues: {
                orderBy: {
                    orderIndex: "asc",
                },
                select: {
                    id: true,
                    content: true,
                    penaltyPoints: true,
                    orderIndex: true,
                },
            },
            _count: {
                select: {
                    clues: true,
                },
            },
        },
    },
    _count: {
        select: {
            steps: true,
            participations: true,
        },
    },
} satisfies Prisma.HuntSelect;

export const huntCreatedSelect = huntOwnerDetailSelect;