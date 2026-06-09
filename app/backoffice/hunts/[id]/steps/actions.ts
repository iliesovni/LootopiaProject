"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { Roles } from "@/lib/auth/roles";
import { rethrowIfRedirect } from "@/lib/frontend/action-utils";
import { ApiClientError } from "@/lib/frontend/api-request";
import { serverApiClient } from "@/lib/frontend/server-api-client";
import { createStepSchema, updateStepSchema } from "@/schemas/step";
import { createClueSchema, updateClueSchema } from "@/schemas/clue";

function num(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function createStepAction(huntId: string, formData: FormData) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  const arMarkerTypeRaw = formData.get("arMarkerType");
  const arMarkerType =
    typeof arMarkerTypeRaw === "string" && arMarkerTypeRaw.trim()
      ? arMarkerTypeRaw
      : null;

  const arAssetUrlRaw = formData.get("arAssetUrl");
  const arAssetUrl =
    typeof arAssetUrlRaw === "string" && arAssetUrlRaw.trim()
      ? arAssetUrlRaw
      : null;

  const payload = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    latitude: num(formData.get("latitude")) ?? NaN,
    longitude: num(formData.get("longitude")) ?? NaN,
    radiusMeters: num(formData.get("radiusMeters")) ?? NaN,
    orderIndex: num(formData.get("orderIndex")) ?? NaN,
    pointsReward: num(formData.get("pointsReward")) ?? NaN,
    huntId,
    arMarkerType,
    arAssetUrl,
  };

  const validation = createStepSchema.safeParse(payload);
  if (!validation.success) {
    redirect(
      `/backoffice/hunts/${huntId}/steps/new?error=${encodeURIComponent(
        validation.error.issues[0]?.message ?? "Formulaire invalide.",
      )}`,
    );
  }

  try {
    const { huntId: _huntId, ...stepInput } = validation.data;
    const created = await serverApiClient.createStep(huntId, stepInput);
    revalidatePath(`/backoffice/hunts/${huntId}`);
    redirect(`/backoffice/hunts/${huntId}/steps/${created.id}`);
  } catch (error) {
    rethrowIfRedirect(error);
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Une erreur est survenue.";
    redirect(
      `/backoffice/hunts/${huntId}/steps/new?error=${encodeURIComponent(message)}`,
    );
  }
}

export async function updateStepAction(
  huntId: string,
  stepId: string,
  formData: FormData,
) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  const arMarkerTypeRaw = formData.get("arMarkerType");
  const arMarkerType =
    typeof arMarkerTypeRaw === "string" && arMarkerTypeRaw.trim()
      ? arMarkerTypeRaw
      : null;

  const arAssetUrlRaw = formData.get("arAssetUrl");
  const arAssetUrl =
    typeof arAssetUrlRaw === "string" && arAssetUrlRaw.trim()
      ? arAssetUrlRaw
      : null;

  const payload = {
    title: String(formData.get("title") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    latitude: num(formData.get("latitude")) ?? undefined,
    longitude: num(formData.get("longitude")) ?? undefined,
    radiusMeters: num(formData.get("radiusMeters")) ?? undefined,
    orderIndex: num(formData.get("orderIndex")) ?? undefined,
    pointsReward: num(formData.get("pointsReward")) ?? undefined,
    arMarkerType,
    arAssetUrl,
  };

  const validation = updateStepSchema.safeParse(payload);
  if (!validation.success) {
    return {
      ok: false as const,
      message: validation.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  try {
    await serverApiClient.updateStep(stepId, validation.data);
    revalidatePath(`/backoffice/hunts/${huntId}`);
    revalidatePath(`/backoffice/hunts/${huntId}/steps/${stepId}`);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof ApiClientError
          ? error.message
          : "Une erreur est survenue.",
    };
  }
}

export async function deleteStepAction(huntId: string, stepId: string) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  try {
    await serverApiClient.deleteStep(stepId);
    revalidatePath(`/backoffice/hunts/${huntId}`);
    redirect(`/backoffice/hunts/${huntId}`);
  } catch (error) {
    rethrowIfRedirect(error);
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Une erreur est survenue.";
    redirect(
      `/backoffice/hunts/${huntId}/steps/${stepId}?error=${encodeURIComponent(message)}`,
    );
  }
}

export async function createClueAction(
  huntId: string,
  stepId: string,
  formData: FormData,
) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  const payload = {
    content: String(formData.get("content") ?? ""),
    penaltyPoints: num(formData.get("penaltyPoints")) ?? NaN,
    stepId,
    orderIndex: num(formData.get("orderIndex")) ?? undefined,
  };

  const validation = createClueSchema.safeParse(payload);
  if (!validation.success) {
    return {
      ok: false as const,
      message: validation.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  try {
    await serverApiClient.createClue(validation.data);
    revalidatePath(`/backoffice/hunts/${huntId}`);
    revalidatePath(`/backoffice/hunts/${huntId}/steps/${stepId}`);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof ApiClientError
          ? error.message
          : "Une erreur est survenue.",
    };
  }
}

export async function updateClueAction(
  huntId: string,
  stepId: string,
  clueId: string,
  formData: FormData,
) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  const payload = {
    content: String(formData.get("content") ?? "") || undefined,
    penaltyPoints: num(formData.get("penaltyPoints")) ?? undefined,
    orderIndex: num(formData.get("orderIndex")) ?? undefined,
  };

  const validation = updateClueSchema.safeParse(payload);
  if (!validation.success) {
    return {
      ok: false as const,
      message: validation.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  try {
    await serverApiClient.updateClue(clueId, validation.data);
    revalidatePath(`/backoffice/hunts/${huntId}`);
    revalidatePath(`/backoffice/hunts/${huntId}/steps/${stepId}`);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof ApiClientError
          ? error.message
          : "Une erreur est survenue.",
    };
  }
}

export async function deleteClueAction(
  huntId: string,
  stepId: string,
  clueId: string,
) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  try {
    await serverApiClient.deleteClue(clueId);
    revalidatePath(`/backoffice/hunts/${huntId}`);
    revalidatePath(`/backoffice/hunts/${huntId}/steps/${stepId}`);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof ApiClientError
          ? error.message
          : "Une erreur est survenue.",
    };
  }
}
