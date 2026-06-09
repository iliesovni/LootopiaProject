"use server";

import { requireRole } from "@/lib/auth/guards";
import { Roles } from "@/lib/auth/roles";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function updateUserRoleAction(userId: string, formData: FormData) {
  await requireRole([Roles.ADMIN]);

  const role = String(formData.get("role") ?? "");
  const allowed = [Roles.PLAYER, Roles.PARTNER, Roles.ADMIN] as const;
  if (!(allowed as readonly string[]).includes(role)) {
    throw new Error("Rôle invalide.");
  }
  const nextRole = role as (typeof allowed)[number];

  await prisma.user.update({
    where: { id: userId },
    data: { role: nextRole },
  });

  revalidatePath("/backoffice/users");
  revalidatePath(`/backoffice/users/${userId}`);
}

export async function upsertPartnerProfileAction(
  userId: string,
  formData: FormData,
) {
  await requireRole([Roles.ADMIN]);

  const companyName = String(formData.get("companyName") ?? "").trim();
  if (companyName.length < 2) {
    throw new Error("Le nom de société doit contenir au moins 2 caractères.");
  }

  await prisma.partner.upsert({
    where: { userId },
    create: { userId, companyName },
    update: { companyName },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { role: Roles.PARTNER },
  });

  revalidatePath("/backoffice/users");
  revalidatePath(`/backoffice/users/${userId}`);
}

export async function resetUserPasswordAction(
  userId: string,
  formData: FormData,
) {
  await requireRole([Roles.ADMIN]);

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  revalidatePath("/backoffice/users");
  revalidatePath(`/backoffice/users/${userId}`);
}

