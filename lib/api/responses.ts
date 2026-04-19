import { NextResponse } from "next/server";

export function apiSuccess(message: string, data?: unknown, status = 200) {
    return NextResponse.json(
        data === undefined
            ? {
                success: true,
                message,
            }
            : {
                success: true,
                message,
                data,
            },
        { status },
    );
}

export function apiError(
    message: string,
    code: string,
    status: number,
    data?: unknown,
) {
    return NextResponse.json(
        data === undefined
            ? {
                success: false,
                error: {
                    code,
                    message,
                },
            }
            : {
                success: false,
                error: {
                    code,
                    message,
                },
                data,
            },
        { status },
    );
}