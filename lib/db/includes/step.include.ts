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