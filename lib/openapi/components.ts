import { ARMarkerType, Difficulty, HuntMode, ParticipationStatus, Role } from "@prisma/client";
import { z } from "zod";

export const uuidParam = (name: string, description: string) =>
    z.string().uuid().openapi({
        param: {
            name,
            in: "path",
            required: true,
            description,
        },
        example: "11111111-1111-1111-1111-111111111111",
    });

export const MessageOnlyResponseSchema = z
.object({
    message: z.string(),
})
.openapi("MessageOnlyResponse");

export const ErrorResponseSchema = z
.object({
    message: z.string(),
    error: z.string(),
})
.openapi("ErrorResponse");

export const ValidationErrorResponseSchema = z
.object({
    message: z.string(),
    error: z.literal("VALIDATION_ERROR"),
    data: z.object({
        details: z.object({
            formErrors: z.array(z.string()),
            fieldErrors: z.record(z.string(), z.array(z.string())),
        }),
    }),
})
.openapi("ValidationErrorResponse");

export const UserSummarySchema = z
.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
    role: z.enum(Role),
})
.openapi("UserSummary");

export const HuntSummarySchema = z
.object({
    id: z.string().uuid(),
    title: z.string(),
    location: z.string(),
    difficulty: z.enum(Difficulty),
    isPublic: z.boolean(),
})
.openapi("HuntSummary");

export const ClueStepSummarySchema = z
.object({
    id: z.string().uuid(),
    title: z.string(),
    orderIndex: z.number().int(),
    huntId: z.string().uuid(),
})
.openapi("ClueStepSummary");

export const ClueSchema = z
.object({
    id: z.string().uuid(),
    content: z.string(),
    penaltyPoints: z.number().int(),
    orderIndex: z.number().int(),
    stepId: z.string().uuid(),
})
.openapi("Clue");

export const ClueWithStepSchema = ClueSchema.extend({
    step: ClueStepSummarySchema,
}).openapi("ClueWithStep");

export const ClueRevealSchema = z
.object({
    id: z.string().uuid(),
    penaltyPoints: z.number().int(),
    orderIndex: z.number().int(),
})
.openapi("ClueReveal");

export const StepHuntSummarySchema = z
.object({
    id: z.string().uuid(),
    title: z.string(),
    location: z.string(),
})
.openapi("StepHuntSummary");

export const StepSchema = z
.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    radiusMeters: z.number().int(),
    orderIndex: z.number().int(),
    pointsReward: z.number().int(),
    arMarkerType: z.enum(ARMarkerType).nullable(),
    arAssetUrl: z.string().url().nullable(),
    huntId: z.string().uuid(),
})
.openapi("Step");

export const StepWithCluesSchema = StepSchema.extend({
    clues: z.array(ClueSchema),
    hunt: StepHuntSummarySchema.optional(),
}).openapi("StepWithClues");

export const HuntSchema = z
.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    location: z.string(),
    difficulty: z.enum(Difficulty),
    isPublic: z.boolean(),
    startLat: z.number(),
    startLng: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    createdById: z.string().uuid(),
    mode: z.enum(HuntMode),
    partnerId: z.string().uuid().nullable(),
})
.openapi("Hunt");

export const HuntWithStepsSchema = HuntSchema.extend({
    createdBy: UserSummarySchema,
    steps: z.array(
        StepSchema.extend({
            clues: z.array(ClueSchema),
        }),
    ),
}).openapi("HuntWithSteps");

export const StepProgressStepSummarySchema = z
.object({
    id: z.string().uuid(),
    title: z.string(),
    orderIndex: z.number().int(),
    pointsReward: z.number().int(),
})
.openapi("StepProgressStepSummary");

export const StepProgressSchema = z
.object({
    id: z.string().uuid(),
    isCompleted: z.boolean(),
    completedAt: z.string().datetime().nullable(),
    cluesUsed: z.number().int(),
    pointsEarned: z.number().int(),
    participationId: z.string().uuid(),
    stepId: z.string().uuid(),
    step: StepProgressStepSummarySchema,
})
.openapi("StepProgress");

export const StepProgressWithCluesSchema = z
.object({
    id: z.string().uuid(),
    isCompleted: z.boolean(),
    completedAt: z.string().datetime().nullable(),
    cluesUsed: z.number().int(),
    pointsEarned: z.number().int(),
    participationId: z.string().uuid(),
    stepId: z.string().uuid(),
    step: StepProgressStepSummarySchema.extend({
        clues: z.array(ClueRevealSchema),
    }),
})
.openapi("StepProgressWithClues");

export const ParticipationSchema = z
.object({
    id: z.string().uuid(),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().nullable(),
    totalScore: z.number().int(),
    status: z.enum(ParticipationStatus),
    userId: z.string().uuid(),
    huntId: z.string().uuid(),
})
.openapi("Participation");

export const ParticipationWithProgressSchema = ParticipationSchema.extend({
    hunt: HuntSummarySchema,
    user: UserSummarySchema,
    stepProgress: z.array(StepProgressSchema),
}).openapi("ParticipationWithProgress");

export const ParticipationWithProgressAndCluesSchema = ParticipationSchema.extend({
    hunt: HuntSummarySchema,
    user: UserSummarySchema,
    stepProgress: z.array(StepProgressWithCluesSchema),
}).openapi("ParticipationWithProgressAndClues");

export const UseClueResponseSchema = z
.object({
    message: z.string(),
    data: z.object({
        clue: ClueRevealSchema,
        cluesUsed: z.number().int(),
        remainingClues: z.number().int(),
    }),
})
.openapi("UseClueResponse");

export const CompleteStepResponseSchema = z
.object({
    message: z.string(),
    data: z.object({
        participationId: z.string().uuid(),
        stepId: z.string().uuid(),
        pointsEarned: z.number().int(),
        totalScore: z.number().int(),
    }),
})
.openapi("CompleteStepResponse");

export const HuntListResponseSchema = z
.object({
    message: z.string(),
    data: z.object({
        count: z.number().int(),
        items: z.array(HuntWithStepsSchema),
    }),
})
.openapi("HuntListResponse");

export const StepListResponseSchema = z
.object({
    message: z.string(),
    data: z.object({
        count: z.number().int(),
        items: z.array(StepWithCluesSchema),
    }),
})
.openapi("StepListResponse");

export const ClueListResponseSchema = z
.object({
    message: z.string(),
    data: z.object({
        count: z.number().int(),
        items: z.array(ClueWithStepSchema),
    }),
})
.openapi("ClueListResponse");

export const StepClueListResponseSchema = z
.object({
    message: z.string(),
    data: z.object({
        count: z.number().int(),
        items: z.array(ClueWithStepSchema),
    }),
})
.openapi("StepClueListResponse");

export const ParticipationResponseSchema = z
.object({
    message: z.string(),
    data: ParticipationWithProgressSchema,
})
.openapi("ParticipationResponse");

export const ParticipationStartResponseSchema = z
.object({
    message: z.string(),
    data: ParticipationWithProgressSchema,
})
.openapi("ParticipationStartResponse");

export const ParticipationFinishResponseSchema = z
.object({
    message: z.string(),
    data: ParticipationWithProgressSchema,
})
.openapi("ParticipationFinishResponse");