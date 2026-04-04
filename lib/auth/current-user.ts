import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";

export class AuthError extends Error {
    code: string;
    status: number;

    constructor(message: string, code = "UNAUTHORIZED", status = 401) {
        super(message);
        this.name = "AuthError";
        this.code = code;
        this.status = status;
    }
}

export const currentUserSelect = {
    id: true,
    email: true,
    username: true,
    role: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect;

export type CurrentUser = Prisma.UserGetPayload<{
    select: typeof currentUserSelect;
}>;

export async function getCurrentUser(): Promise<CurrentUser> {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        throw new AuthError(
            "Authentification requise.",
            "AUTH_TOKEN_MISSING",
            401,
        );
    }

    let payload: Awaited<ReturnType<typeof verifyAuthToken>>;

    try {
        payload = await verifyAuthToken(token);
    } catch {
        throw new AuthError(
            "Session invalide ou expirée.",
            "INVALID_OR_EXPIRED_TOKEN",
            401,
        );
    }

    const user = await prisma.user.findUnique({
        where: {
            id: payload.sub,
        },
        select: currentUserSelect,
    });

    if (!user) {
        throw new AuthError(
            "Utilisateur introuvable.",
            "USER_NOT_FOUND",
            401,
        );
    }

    return user;
}