import { Prisma } from "@prisma/client";

export const stepOwnerDetailSelect = {
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
    hunt: {
        select: {
            id: true,
            title: true,
            createdById: true,
            status: true,
            visibility: true,
            isDeleted: true,
        },
    },
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
} satisfies Prisma.StepSelect;

export const stepPublicSelect = {
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
    hunt: {
        select: {
            id: true,
        },
    },
    _count: {
        select: {
            clues: true,
        },
    },
} satisfies Prisma.StepSelect;