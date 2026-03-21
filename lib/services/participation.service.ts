import { ParticipationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export class ParticipationError extends Error {
    constructor(code: string) {
        super(code);
        this.name = "ParticipationError";
    }
}

type ClueLike = {
    penaltyPoints: number;
    orderIndex: number;
};

type StepLike = {
    clues: ClueLike[];
    pointsReward: number;
};

type StepProgressWithNullableStep = {
    stepId: string;
    isCompleted: boolean;
    cluesUsed: number;
    step: StepLike | null;
};

type StepProgressWithStep = {
    stepId: string;
    isCompleted: boolean;
    cluesUsed: number;
    step: StepLike;
};

type ParticipationWithProgress = {
    status: ParticipationStatus;
    stepProgress: StepProgressWithNullableStep[];
};

export function getTargetStepProgress(
    participation: ParticipationWithProgress,
    stepId: string,
): StepProgressWithStep {
    if (participation.status !== ParticipationStatus.IN_PROGRESS) {
        throw new ParticipationError("PARTICIPATION_NOT_IN_PROGRESS");
    }

    const targetProgress = participation.stepProgress.find(
        (progress) => progress.stepId === stepId,
    );

    if (!targetProgress) {
        throw new ParticipationError("STEP_NOT_IN_PARTICIPATION");
    }

    if (!targetProgress.step) {
        throw new ParticipationError("STEP_MISCONFIGURED");
    }

    if (targetProgress.isCompleted) {
        throw new ParticipationError("STEP_ALREADY_COMPLETED");
    }

    const nextExpectedProgress = participation.stepProgress.find(
        (progress) => !progress.isCompleted,
    );

    if (!nextExpectedProgress || nextExpectedProgress.stepId !== stepId) {
        throw new ParticipationError("STEP_OUT_OF_ORDER");
    }

    return {
        ...targetProgress,
        step: targetProgress.step,
    };
}

export function mapParticipationError(error: unknown) {
    if (error instanceof ParticipationError) {
        switch (error.message) {
            case "PARTICIPATION_NOT_IN_PROGRESS":
                return NextResponse.json(
                    {
                        message: "La participation n'est pas en cours.",
                        error: "PARTICIPATION_NOT_IN_PROGRESS",
                    },
                    { status: 409 },
                );

            case "STEP_NOT_IN_PARTICIPATION":
                return NextResponse.json(
                    {
                        message: "Cette étape n'appartient pas à la participation.",
                        error: "STEP_NOT_IN_PARTICIPATION",
                    },
                    { status: 404 },
                );

            case "STEP_MISCONFIGURED":
                return NextResponse.json(
                    {
                        message: "Step mal configurée.",
                        error: "STEP_MISCONFIGURED",
                    },
                    { status: 500 },
                );

            case "STEP_ALREADY_COMPLETED":
                return NextResponse.json(
                    {
                        message: "Cette étape est déjà complétée.",
                        error: "STEP_ALREADY_COMPLETED",
                    },
                    { status: 409 },
                );

            case "STEP_OUT_OF_ORDER":
                return NextResponse.json(
                    {
                        message: "Impossible d'effectuer cette action sur cette étape maintenant.",
                        error: "STEP_OUT_OF_ORDER",
                    },
                    { status: 409 },
                );
        }
    }

    return null;
}