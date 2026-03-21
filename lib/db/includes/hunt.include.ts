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