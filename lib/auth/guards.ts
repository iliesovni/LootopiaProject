import { AuthError, type CurrentUser, getCurrentUser } from "@/lib/auth/current-user";
import { Role } from "@prisma/client";

export async function requireAuth(): Promise<CurrentUser> {
    return getCurrentUser();
}

export async function requireRole(allowedRoles: Role[]): Promise<CurrentUser> {
    const user = await getCurrentUser();

    if (!allowedRoles.includes(user.role)) {
        throw new AuthError(
            "Vous n'avez pas l'autorisation d'effectuer cette action.",
            "FORBIDDEN",
            403,
        );
    }

    return user;
}