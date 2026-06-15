import { signAuthToken } from "@/lib/auth/jwt";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { Prisma, Role } from "@prisma/client";

export class AuthServiceError extends Error {
    code: string;
    status: number;

    constructor(message: string, code: string, status = 400) {
        super(message);
        this.name = "AuthServiceError";
        this.code = code;
        this.status = status;
    }
}

const publicUserSelect = {
    id: true,
    email: true,
    username: true,
    role: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect;

type PublicUser = Prisma.UserGetPayload<{
    select: typeof publicUserSelect;
}>;

type RegisterInput = {
    email: string;
    username: string;
    password: string;
};

type LoginInput = {
    identifier: string;
    password: string;
};

function isEmailIdentifier(identifier: string): boolean {
    return identifier.includes("@");
}

export async function registerUser(input: RegisterInput): Promise<PublicUser> {
    const { email, username, password } = input;

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email }, { username }],
        },
        select: {
            id: true,
            email: true,
            username: true,
        },
    });

    if (existingUser) {
        if (existingUser.email === email) {
            throw new AuthServiceError(
                "Cet email est déjà utilisé.",
                "EMAIL_ALREADY_EXISTS",
                409,
            );
        }

        if (existingUser.username === username) {
            throw new AuthServiceError(
                "Ce nom d'utilisateur est déjà utilisé.",
                "USERNAME_ALREADY_EXISTS",
                409,
            );
        }
    }

    const passwordHash = await hashPassword(password);

    try {
        return await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    email,
                    username,
                    passwordHash,
                    role: Role.PLAYER,
                },
                select: publicUserSelect,
            });

            await tx.userStats.create({
                data: {
                    userId: createdUser.id,
                },
            });

            return createdUser;
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                throw new AuthServiceError(
                    "Email ou nom d'utilisateur déjà utilisé.",
                    "UNIQUE_CONSTRAINT_VIOLATION",
                    409,
                );
            }
        }

        throw error;
    }
}

export async function loginUser(input: LoginInput): Promise<{
    user: PublicUser;
    token: string;
}> {
    const { identifier, password } = input;

    const where = isEmailIdentifier(identifier)
        ? { email: identifier }
        : { username: identifier };

    const user = await prisma.user.findUnique({
        where,
        select: {
            id: true,
            email: true,
            username: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            passwordHash: true,
        },
    });

    if (!user) {
        throw new AuthServiceError(
            "Identifiants invalides.",
            "INVALID_CREDENTIALS",
            401,
        );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
        throw new AuthServiceError(
            "Identifiants invalides.",
            "INVALID_CREDENTIALS",
            401,
        );
    }

    const token = await signAuthToken({
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
    });

    const { passwordHash, ...publicUser } = user;

    return {
        user: publicUser,
        token,
    };
}