import { NextResponse } from "next/server";
import { z } from "zod";

export function apiValidationError(error: z.ZodError) {
    return NextResponse.json(
        {
            message: "Payload invalide.",
            error: "VALIDATION_ERROR",
            data: {
                details: z.flattenError(error),
            },
        },
        { status: 400 },
    );
}