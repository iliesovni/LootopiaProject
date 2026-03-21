import { NextResponse } from "next/server";

export function apiSuccess(message: string, data?: unknown, status = 200) {
    return NextResponse.json(
        data === undefined ? { message } : { message, data },
        { status },
    );
}

export function apiError(
    message: string,
    error: string,
    status: number,
    data?: unknown,
) {
    return NextResponse.json(
        data === undefined
            ? { message, error }
            : { message, error, data },
        { status },
    );
}