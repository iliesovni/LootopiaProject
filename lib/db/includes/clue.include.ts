import { Prisma } from "@prisma/client";

export const clueInclude = {
    step: {
        select: {
            id: true,
            title: true,
            orderIndex: true,
            huntId: true,
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
        },
    },
} satisfies Prisma.ClueInclude;