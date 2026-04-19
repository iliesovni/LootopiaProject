import { NextResponse } from "next/server";
import { z } from "zod";

export function apiValidationError(error: z.ZodError) {
    return NextResponse.json(
        {
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Payload invalide.",
            },
            data: {
                details: z.flattenError(error),
            },
        },
        { status: 400 },
    );
}