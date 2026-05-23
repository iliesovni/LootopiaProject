import { Prisma } from "@prisma/client";

export const clueOwnerDetailSelect = {
    id: true,
    content: true,
    penaltyPoints: true,
    orderIndex: true,
    step: {
        select: {
            id: true,
            title: true,
            orderIndex: true,
            huntId: true,
        },
    },
} satisfies Prisma.ClueSelect;