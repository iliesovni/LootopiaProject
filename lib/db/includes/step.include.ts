import { Prisma } from "@prisma/client";
import { clueInclude } from "./clue.include";

export const stepInclude = {
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
        include: clueInclude,
        orderBy: {
            orderIndex: "asc",
        },
    },
} satisfies Prisma.StepInclude;