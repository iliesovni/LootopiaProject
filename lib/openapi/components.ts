import { loginSchema, registerSchema } from "@/schemas/auth";
import { createClueSchema, updateClueSchema } from "@/schemas/clue";
import { createHuntSchema, updateHuntSchema } from "@/schemas/hunt";
import { completeStepSchema, startParticipationSchema, useClueSchema } from "@/schemas/participation";
import { createStepSchema, updateStepSchema } from "@/schemas/step";
import {
    ARMarkerType,
    Difficulty,
    HuntMode,
    HuntStatus,
    HuntVisibility,
    ParticipationStatus,
    Role,
} from "@prisma/client";
import { z } from "zod";

export const MessageOnlyResponseSchema = z
.object({
    message: z.string().openapi({ example: "Opération réussie." }),
})
.openapi("MessageOnlyResponse");

export const ErrorResponseSchema = z
.object({
    message: z.string().openapi({ example: "Ressource introuvable." }),
    error: z.string().openapi({ example: "RESOURCE_NOT_FOUND" }),
})
.openapi("ErrorResponse");

export const ValidationErrorResponseSchema = z
.object({
    message: z.string().openapi({ example: "Payload invalide." }),
    error: z.literal("VALIDATION_ERROR"),
    data: z.object({
        details: z.object({
            formErrors: z.array(z.string()).openapi({
                example: [],
            }),
            fieldErrors: z.record(z.string(), z.array(z.string())).openapi({
                example: {
                    title: ["Le titre doit contenir au moins 3 caractères."],
                },
            }),
        }),
    }),
})
.openapi("ValidationErrorResponse");

export const RegisterRequestSchema = registerSchema
.openapi("RegisterRequest");

export const LoginRequestSchema = loginSchema
.openapi("LoginRequest");

export const AuthUserSchema = z
.object({
    id: z.uuid().openapi({
        example: "11111111-1111-1111-1111-111111111111",
    }),
    email: z.email().openapi({
        example: "john.doe@example.com",
    }),
    username: z.string().openapi({
        example: "john_doe",
    }),
    role: z.enum(Role).openapi({
        example: Role.PLAYER,
    }),
    avatarUrl: z.string().nullable().openapi({
        example: null,
    }),
    createdAt: z.iso.datetime().openapi({
        example: "2026-04-06T10:00:00.000Z",
    }),
    updatedAt: z.iso.datetime().openapi({
        example: "2026-04-06T10:00:00.000Z",
    }),
})
.openapi("AuthUser");

export const RegisterResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Utilisateur créé avec succès.",
    }),
    data: AuthUserSchema,
})
.openapi("RegisterResponse");

export const LoginResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Connexion réussie.",
    }),
    data: AuthUserSchema,
})
.openapi("LoginResponse");

export const MeResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Utilisateur authentifié.",
    }),
    data: AuthUserSchema,
})
.openapi("MeResponse");

export const LogoutResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Déconnexion réussie.",
    }),
})
.openapi("LogoutResponse");

export const CreateHuntRequestSchema = createHuntSchema
.openapi("CreateHuntRequest");

export const UpdateHuntRequestSchema = updateHuntSchema
.openapi("UpdateHuntRequest");

export const HuntAuthorUsernameSchema = z
.object({
    username: z.string().openapi({
        example: "john_doe",
    }),
})
.openapi("HuntAuthorUsername");

export const HuntOwnerCreatedBySchema = z
.object({
    id: z.uuid().openapi({
        example: "11111111-1111-1111-1111-111111111111",
    }),
    username: z.string().openapi({
        example: "john_doe",
    }),
    role: z.enum(Role).openapi({
        example: Role.PLAYER,
    }),
})
.openapi("HuntOwnerCreatedBy");

export const HuntCountsSchema = z
.object({
    steps: z.number().int().openapi({
        example: 3,
    }),
})
.openapi("HuntCounts");

export const HuntOwnerCountsSchema = z
.object({
    steps: z.number().int().openapi({
        example: 3,
    }),
    participations: z.number().int().openapi({
        example: 12,
    }),
})
.openapi("HuntOwnerCounts");

export const HuntOwnerStepSchema = z
.object({
    id: z.uuid().openapi({
        example: "22222222-2222-2222-2222-222222222222",
    }),
    title: z.string().openapi({
        example: "Trouver le point de départ",
    }),
    description: z.string().openapi({
        example: "Rejoins la place centrale pour démarrer la chasse.",
    }),
    latitude: z.number().openapi({
        example: 48.8566,
    }),
    longitude: z.number().openapi({
        example: 2.3522,
    }),
    radiusMeters: z.number().int().openapi({
        example: 30,
    }),
    pointsReward: z.number().int().openapi({
        example: 50,
    }),
    orderIndex: z.number().int().openapi({
        example: 1,
    }),
    clues: z.array(
        z.object({
            id: z.uuid().openapi({
                example: "33333333-3333-3333-3333-333333333333",
            }),
            content: z.string().openapi({
                example: "Regarde près de la fontaine.",
            }),
            penaltyPoints: z.number().int().openapi({
                example: 10,
            }),
            orderIndex: z.number().int().openapi({
                example: 1,
            }),
        }),
    ),
    _count: z.object({
        clues: z.number().int().openapi({
            example: 2,
        }),
    }),
})
.openapi("HuntOwnerStep");

export const HuntPublicListItemSchema = z
.object({
    id: z.uuid().openapi({
        example: "11111111-1111-1111-1111-111111111111",
    }),
    title: z.string().openapi({
        example: "Chasse du centre historique",
    }),
    description: z.string().nullable().openapi({
        example: "Une chasse urbaine au cœur de la ville.",
    }),
    location: z.string().openapi({
        example: "Paris",
    }),
    difficulty: z.enum(Difficulty).openapi({
        example: Difficulty.EASY,
    }),
    bannerUrl: z.string().nullable().openapi({
        example: "https://example.com/banner.jpg",
    }),
    createdAt: z.iso.datetime().openapi({
        example: "2026-04-06T10:00:00.000Z",
    }),
    startLat: z.number().openapi({
        example: 48.8566,
    }),
    startLng: z.number().openapi({
        example: 2.3522,
    }),
    createdBy: HuntAuthorUsernameSchema,
    _count: HuntCountsSchema,
})
.openapi("HuntPublicListItem");

export const HuntPublicListResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Chasses récupérées avec succès.",
    }),
    data: z.object({
        count: z.number().int().openapi({
            example: 2,
        }),
        items: z.array(HuntPublicListItemSchema),
    }),
})
.openapi("HuntPublicListResponse");

export const HuntPublicDetailSchema = HuntPublicListItemSchema
.openapi("HuntPublicDetail");

export const HuntOwnerDetailSchema = z
.object({
    id: z.uuid().openapi({
        example: "11111111-1111-1111-1111-111111111111",
    }),
    title: z.string().openapi({
        example: "Chasse du centre historique",
    }),
    description: z.string().nullable().openapi({
        example: "Une chasse urbaine au cœur de la ville.",
    }),
    location: z.string().openapi({
        example: "Paris",
    }),
    difficulty: z.enum(Difficulty).openapi({
        example: Difficulty.MEDIUM,
    }),
    bannerUrl: z.string().nullable().openapi({
        example: "https://example.com/banner.jpg",
    }),
    createdAt: z.iso.datetime().openapi({
        example: "2026-04-06T10:00:00.000Z",
    }),
    updatedAt: z.iso.datetime().openapi({
        example: "2026-04-06T12:00:00.000Z",
    }),
    mode: z.enum(HuntMode).openapi({
        example: HuntMode.COMMUNITY,
    }),
    status: z.enum(HuntStatus).openapi({
        example: HuntStatus.DRAFT,
    }),
    visibility: z.enum(HuntVisibility).openapi({
        example: HuntVisibility.PUBLIC,
    }),
    accessCode: z.string().nullable().openapi({
        example: null,
    }),
    isDeleted: z.boolean().openapi({
        example: false,
    }),
    createdById: z.uuid().openapi({
        example: "11111111-1111-1111-1111-111111111111",
    }),
    partnerId: z.uuid().nullable().openapi({
        example: null,
    }),
    startLat: z.number().openapi({
        example: 48.8566,
    }),
    startLng: z.number().openapi({
        example: 2.3522,
    }),
    createdBy: HuntOwnerCreatedBySchema,
    steps: z.array(HuntOwnerStepSchema),
    _count: HuntOwnerCountsSchema,
})
.openapi("HuntOwnerDetail");

export const HuntResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Chasse trouvée.",
    }),
    data: z.union([HuntPublicDetailSchema, HuntOwnerDetailSchema]),
})
.openapi("HuntResponse");

export const HuntCreatedResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Chasse créée avec succès.",
    }),
    data: HuntOwnerDetailSchema,
})
.openapi("HuntCreatedResponse");

export const HuntUpdatedResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Chasse mise à jour avec succès.",
    }),
    data: HuntOwnerDetailSchema,
})
.openapi("HuntUpdatedResponse");

export const CreateStepRequestSchema = createStepSchema
.openapi("CreateStepRequest");

export const UpdateStepRequestSchema = updateStepSchema
.openapi("UpdateStepRequest");

export const StepPublicSchema = z
.object({
    id: z.uuid().openapi({
        example: "22222222-2222-2222-2222-222222222222",
    }),
    title: z.string().openapi({
        example: "Trouver le point de départ",
    }),
    description: z.string().openapi({
        example: "Rends-toi sur la place centrale.",
    }),
    latitude: z.number().openapi({
        example: 48.8566,
    }),
    longitude: z.number().openapi({
        example: 2.3522,
    }),
    radiusMeters: z.number().int().openapi({
        example: 30,
    }),
    orderIndex: z.number().int().openapi({
        example: 1,
    }),
    pointsReward: z.number().int().openapi({
        example: 50,
    }),
    arMarkerType: z.enum(ARMarkerType).nullable().openapi({
        example: null,
    }),
    arAssetUrl: z.string().nullable().openapi({
        example: null,
    }),
    hunt: z.object({
        id: z.uuid().openapi({
            example: "11111111-1111-1111-1111-111111111111",
        }),
    }),
    _count: z.object({
        clues: z.number().int().openapi({
            example: 2,
        }),
    }),
})
.openapi("StepPublic");

export const StepOwnerSchema = z
.object({
    id: z.uuid().openapi({
        example: "22222222-2222-2222-2222-222222222222",
    }),
    title: z.string().openapi({
        example: "Trouver le point de départ",
    }),
    description: z.string().openapi({
        example: "Rends-toi sur la place centrale.",
    }),
    latitude: z.number().openapi({
        example: 48.8566,
    }),
    longitude: z.number().openapi({
        example: 2.3522,
    }),
    radiusMeters: z.number().int().openapi({
        example: 30,
    }),
    orderIndex: z.number().int().openapi({
        example: 1,
    }),
    pointsReward: z.number().int().openapi({
        example: 50,
    }),
    arMarkerType: z.enum(ARMarkerType).nullable().openapi({
        example: null,
    }),
    arAssetUrl: z.string().nullable().openapi({
        example: null,
    }),
    hunt: z.object({
        id: z.uuid().openapi({
            example: "11111111-1111-1111-1111-111111111111",
        }),
        title: z.string().openapi({
            example: "Chasse du centre historique",
        }),
        createdById: z.uuid().openapi({
            example: "11111111-1111-1111-1111-111111111111",
        }),
        status: z.enum(HuntStatus).openapi({
            example: HuntStatus.DRAFT,
        }),
        visibility: z.enum(HuntVisibility).openapi({
            example: HuntVisibility.PUBLIC,
        }),
        isDeleted: z.boolean().openapi({
            example: false,
        }),
    }),
    clues: z.array(
        z.object({
            id: z.uuid().openapi({
                example: "33333333-3333-3333-3333-333333333333",
            }),
            content: z.string().openapi({
                example: "Regarde près de la fontaine.",
            }),
            penaltyPoints: z.number().int().openapi({
                example: 10,
            }),
            orderIndex: z.number().int().openapi({
                example: 1,
            }),
        }),
    ),
    _count: z.object({
        clues: z.number().int().openapi({
            example: 2,
        }),
    }),
})
.openapi("StepOwner");

export const StepResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Étape récupérée.",
    }),
    data: z.union([StepPublicSchema, StepOwnerSchema]),
})
.openapi("StepResponse");

export const StepListResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Les étapes ont été récupérées.",
    }),
    data: z.object({
        count: z.number().int().openapi({
            example: 3,
        }),
        items: z.array(StepPublicSchema),
    }),
})
.openapi("StepListResponse");

export const StepCreatedResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Étape créée avec succès.",
    }),
    data: StepOwnerSchema,
})
.openapi("StepCreatedResponse");

export const StepUpdatedResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Étape mise à jour avec succès.",
    }),
    data: StepOwnerSchema,
})
.openapi("StepUpdatedResponse");

export const CreateClueRequestSchema = createClueSchema
.openapi("CreateClueRequest");

export const UpdateClueRequestSchema = updateClueSchema
.openapi("UpdateClueRequest");

export const ClueOwnerSchema = z
.object({
    id: z.uuid().openapi({
        example: "33333333-3333-3333-3333-333333333333",
    }),
    content: z.string().openapi({
        example: "Regarde près de la fontaine.",
    }),
    penaltyPoints: z.number().int().openapi({
        example: 10,
    }),
    orderIndex: z.number().int().openapi({
        example: 1,
    }),
    step: z.object({
        id: z.uuid().openapi({
            example: "22222222-2222-2222-2222-222222222222",
        }),
        title: z.string().openapi({
            example: "Trouver le point de départ",
        }),
        orderIndex: z.number().int().openapi({
            example: 1,
        }),
        huntId: z.uuid().openapi({
            example: "11111111-1111-1111-1111-111111111111",
        }),
    }),
})
.openapi("ClueOwner");

export const ClueResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Indice récupéré.",
    }),
    data: ClueOwnerSchema,
})
.openapi("ClueResponse");

export const ClueListResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Indices de l'étape récupérés avec succès.",
    }),
    data: z.object({
        count: z.number().int().openapi({
            example: 2,
        }),
        items: z.array(ClueOwnerSchema),
    }),
})
.openapi("ClueListResponse");

export const ClueCreatedResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Indice créé avec succès.",
    }),
    data: ClueOwnerSchema,
})
.openapi("ClueCreatedResponse");

export const ClueUpdatedResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Indice mis à jour avec succès.",
    }),
    data: ClueOwnerSchema,
})
.openapi("ClueUpdatedResponse");

export const StartParticipationRequestSchema = startParticipationSchema
.openapi("StartParticipationRequest");

export const CompleteStepRequestSchema = completeStepSchema
.openapi("CompleteStepRequest");

export const UseClueRequestSchema = useClueSchema
.openapi("UseClueRequest");

export const ParticipationHuntSummarySchema = z
.object({
    id: z.uuid().openapi({
        example: "11111111-1111-1111-1111-111111111111",
    }),
    title: z.string().openapi({
        example: "Chasse du centre historique",
    }),
    location: z.string().openapi({
        example: "Paris",
    }),
    difficulty: z.enum(Difficulty).openapi({
        example: Difficulty.EASY,
    }),
    bannerUrl: z.string().nullable().openapi({
        example: "https://example.com/banner.jpg",
    }),
})
.openapi("ParticipationHuntSummary");

export const ParticipationStepSummarySchema = z
.object({
    id: z.uuid().openapi({
        example: "22222222-2222-2222-2222-222222222222",
    }),
    title: z.string().openapi({
        example: "Trouver le point de départ",
    }),
    orderIndex: z.number().int().openapi({
        example: 1,
    }),
    pointsReward: z.number().int().openapi({
        example: 50,
    }),
})
.openapi("ParticipationStepSummary");

export const ParticipationStepProgressSchema = z
.object({
    stepId: z.uuid().openapi({
        example: "22222222-2222-2222-2222-222222222222",
    }),
    isCompleted: z.boolean().openapi({
        example: false,
    }),
    cluesUsed: z.number().int().openapi({
        example: 1,
    }),
    pointsEarned: z.number().int().openapi({
        example: 0,
    }),
    completedAt: z.iso.datetime().nullable().openapi({
        example: null,
    }),
    step: ParticipationStepSummarySchema.nullable(),
})
.openapi("ParticipationStepProgress");

export const ParticipationGameplaySchema = z
.object({
    id: z.uuid().openapi({
        example: "44444444-4444-4444-4444-444444444444",
    }),
    status: z.enum(ParticipationStatus).openapi({
        example: ParticipationStatus.IN_PROGRESS,
    }),
    totalScore: z.number().int().openapi({
        example: 0,
    }),
    startedAt: z.iso.datetime().openapi({
        example: "2026-04-06T10:00:00.000Z",
    }),
    completedAt: z.iso.datetime().nullable().openapi({
        example: null,
    }),
    huntId: z.uuid().openapi({
        example: "11111111-1111-1111-1111-111111111111",
    }),
    userId: z.uuid().openapi({
        example: "55555555-5555-5555-5555-555555555555",
    }),
    hunt: ParticipationHuntSummarySchema.nullable(),
    currentStep: ParticipationStepProgressSchema.nullable(),
    completedSteps: z.array(ParticipationStepProgressSchema),
})
.openapi("ParticipationGameplay");

export const ParticipationGameplayResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Participation récupérée avec succès.",
    }),
    data: ParticipationGameplaySchema,
})
.openapi("ParticipationGameplayResponse");

export const UseClueResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Indice utilisé avec succès.",
    }),
    data: z.object({
        clue: z.object({
            content: z.string().openapi({
                example: "Regarde près de la fontaine.",
            }),
        }),
        cluesUsed: z.number().int().openapi({
            example: 1,
        }),
        remainingClues: z.number().int().openapi({
            example: 1,
        }),
    }),
})
.openapi("UseClueResponse");

export const CompleteStepResponseSchema = z
.object({
    message: z.string().openapi({
        example: "Étape complétée avec succès.",
    }),
    data: z.object({
        participationId: z.uuid().openapi({
            example: "44444444-4444-4444-4444-444444444444",
        }),
        stepId: z.uuid().openapi({
            example: "22222222-2222-2222-2222-222222222222",
        }),
        pointsEarned: z.number().int().openapi({
            example: 40,
        }),
        totalScore: z.number().int().openapi({
            example: 40,
        }),
    }),
})
.openapi("CompleteStepResponse");