"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { Roles } from "@/lib/auth/roles";
import { rethrowIfRedirect } from "@/lib/frontend/action-utils";
import { ApiClientError } from "@/lib/frontend/api-request";
import { serverApiClient } from "@/lib/frontend/server-api-client";
import { createHuntSchema, updateHuntSchema } from "@/schemas/hunt";

function formNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function apiErrorRedirect(path: string, error: unknown): never {
  const message =
    error instanceof ApiClientError
      ? error.message
      : "Une erreur est survenue.";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createHuntAction(formData: FormData) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  const raw = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    location: String(formData.get("location") ?? ""),
    difficulty: String(formData.get("difficulty") ?? ""),
    visibility: String(formData.get("visibility") ?? ""),
    accessCode: String(formData.get("accessCode") ?? "") || undefined,
    startLat: formNumber(formData.get("startLat")),
    startLng: formNumber(formData.get("startLng")),
  };

  const payload = {
    title: raw.title,
    description: raw.description,
    location: raw.location,
    difficulty: raw.difficulty,
    visibility: raw.visibility ? raw.visibility : undefined,
    accessCode: raw.accessCode,
    startLat: raw.startLat ?? NaN,
    startLng: raw.startLng ?? NaN,
  };

  const validation = createHuntSchema.safeParse(payload);
  if (!validation.success) {
    const message =
      validation.error.issues[0]?.message ?? "Formulaire invalide.";
    redirect(`/backoffice/hunts/new?error=${encodeURIComponent(message)}`);
  }

  try {
    const hunt = await serverApiClient.createHunt(validation.data);
    revalidatePath("/backoffice/hunts");
    redirect(`/backoffice/hunts/${hunt.id}`);
  } catch (error) {
    rethrowIfRedirect(error);
    apiErrorRedirect("/backoffice/hunts/new", error);
  }
}

export async function updateHuntAction(huntId: string, formData: FormData) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  const payload = {
    title: String(formData.get("title") ?? "") || undefined,
    description:
      formData.get("description") === null
        ? undefined
        : String(formData.get("description") ?? "") || null,
    location: String(formData.get("location") ?? "") || undefined,
    difficulty: String(formData.get("difficulty") ?? "") || undefined,
    visibility: String(formData.get("visibility") ?? "") || undefined,
    accessCode: String(formData.get("accessCode") ?? "") || undefined,
    startLat: formNumber(formData.get("startLat")) ?? undefined,
    startLng: formNumber(formData.get("startLng")) ?? undefined,
  };

  const validation = updateHuntSchema.safeParse(payload);
  if (!validation.success) {
    const message =
      validation.error.issues[0]?.message ?? "Formulaire invalide.";
    redirect(
      `/backoffice/hunts/${huntId}?error=${encodeURIComponent(message)}`,
    );
  }

  try {
    await serverApiClient.updateHunt(huntId, validation.data);
    revalidatePath(`/backoffice/hunts/${huntId}`);
    revalidatePath("/backoffice/hunts");
  } catch (error) {
    rethrowIfRedirect(error);
    apiErrorRedirect(`/backoffice/hunts/${huntId}`, error);
  }
}

export async function publishHuntAction(huntId: string) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  try {
    await serverApiClient.publishHunt(huntId);
    revalidatePath(`/backoffice/hunts/${huntId}`);
    revalidatePath("/backoffice/hunts");
  } catch (error) {
    rethrowIfRedirect(error);
    apiErrorRedirect(`/backoffice/hunts/${huntId}`, error);
  }
}

export async function deleteHuntAction(huntId: string) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  try {
    await serverApiClient.deleteHunt(huntId);
    revalidatePath("/backoffice/hunts");
    redirect("/backoffice/hunts");
  } catch (error) {
    rethrowIfRedirect(error);
    apiErrorRedirect(`/backoffice/hunts/${huntId}`, error);
  }
}
