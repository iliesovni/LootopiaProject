export const huntInclude = {
    createdBy: {
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
        },
    },
    steps: {
        orderBy: {
            orderIndex: "asc" as const,
        },
        include: {
            clues: {
                orderBy: {
                    orderIndex: "asc" as const,
                },
            },
        },
    },
};

export const stepInclude = {
    hunt: {
        select: {
            id: true,
            title: true,
            location: true,
        },
    },
    clues: {
        orderBy: {
            orderIndex: "asc" as const,
        },
    },
};

export const clueInclude = {
    step: {
        select: {
            id: true,
            title: true,
            orderIndex: true,
            huntId: true,
        },
    },
};

export const participationInclude = {
    hunt: {
        select: {
            id: true,
            title: true,
            location: true,
            difficulty: true,
            isPublic: true,
        },
    },
    user: {
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
        },
    },
    stepProgress: {
        include: {
            step: {
                select: {
                    id: true,
                    title: true,
                    orderIndex: true,
                    pointsReward: true,
                },
            },
        },
        orderBy: {
            step: {
                orderIndex: "asc" as const,
            },
        },
    },
};

export const participationProgressInclude = {
    hunt: {
        select: {
            id: true,
            title: true,
            location: true,
            difficulty: true,
            isPublic: true,
        },
    },
    user: {
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
        },
    },
    stepProgress: {
        include: {
            step: {
                select: {
                    id: true,
                    title: true,
                    orderIndex: true,
                    pointsReward: true,
                    clues: {
                        select: {
                            id: true,
                            penaltyPoints: true,
                            orderIndex: true,
                        },
                        orderBy: {
                            orderIndex: "asc" as const,
                        },
                    },
                },
            },
        },
        orderBy: {
            step: {
                orderIndex: "asc" as const,
            },
        },
    },
};