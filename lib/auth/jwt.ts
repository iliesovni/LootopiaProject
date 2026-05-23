import { Role } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET est manquant dans les variables d'environnement.");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

export type AuthTokenPayload = {
    sub: string;
    email: string;
    username: string;
    role: Role;
};

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
    return new SignJWT({
        email: payload.email,
        username: payload.username,
        role: payload.role,
    })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyAuthToken(token: string) {
    const { payload } = await jwtVerify(token, secretKey);

    return {
        sub: payload.sub as string,
        email: payload.email as string,
        username: payload.username as string,
        role: payload.role as Role,
    };
}