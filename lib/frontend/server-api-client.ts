import { cookies, headers } from "next/headers";
import { parseApiResponse } from "@/lib/frontend/api-request";
import type {
  CreateClueInput,
  CreateHuntInput,
  CreateStepInput,
  HuntOwnerDetail,
  UpdateClueInput,
  UpdateHuntInput,
  UpdateStepInput,
} from "@/lib/frontend/api-client";

async function getServerBaseUrl() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

async function serverRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const baseUrl = await getServerBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  return parseApiResponse<T>(response);
}

export type StepDetail = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  pointsReward: number;
  orderIndex: number;
  arMarkerType: string | null;
  arAssetUrl: string | null;
  huntId: string;
};

export type ClueDetail = {
  id: string;
  content: string;
  penaltyPoints: number;
  orderIndex: number;
  stepId: string;
};

export const serverApiClient = {
  listMyHunts: async () => {
    const hunts = await serverRequest<HuntOwnerDetail[]>("/api/me/hunts", {
      method: "GET",
    });
    return hunts ?? [];
  },

  getHuntDetail: (huntId: string) =>
    serverRequest<HuntOwnerDetail>(`/api/hunts/${huntId}`, {
      method: "GET",
    }),

  createHunt: (input: CreateHuntInput) =>
    serverRequest<HuntOwnerDetail>("/api/hunts", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateHunt: (huntId: string, input: UpdateHuntInput) =>
    serverRequest<HuntOwnerDetail>(`/api/hunts/${huntId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteHunt: (huntId: string) =>
    serverRequest<void>(`/api/hunts/${huntId}`, {
      method: "DELETE",
    }),

  publishHunt: (huntId: string) =>
    serverRequest<HuntOwnerDetail>(`/api/hunts/${huntId}/publish`, {
      method: "POST",
    }),

  getStep: (stepId: string) =>
    serverRequest<StepDetail>(`/api/steps/${stepId}`, {
      method: "GET",
    }),

  listStepClues: async (stepId: string) => {
    const result = await serverRequest<{ count: number; items: ClueDetail[] }>(
      `/api/steps/${stepId}/clues`,
      { method: "GET" },
    );
    return result?.items ?? [];
  },

  createStep: (huntId: string, input: Omit<CreateStepInput, "huntId">) =>
    serverRequest<StepDetail>(`/api/hunts/${huntId}/steps`, {
      method: "POST",
      body: JSON.stringify({ ...input, huntId }),
    }),

  updateStep: (stepId: string, input: UpdateStepInput) =>
    serverRequest<StepDetail>(`/api/steps/${stepId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteStep: (stepId: string) =>
    serverRequest<void>(`/api/steps/${stepId}`, {
      method: "DELETE",
    }),

  createClue: (input: CreateClueInput) =>
    serverRequest<ClueDetail>("/api/clues", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateClue: (clueId: string, input: UpdateClueInput) =>
    serverRequest<ClueDetail>(`/api/clues/${clueId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteClue: (clueId: string) =>
    serverRequest<void>(`/api/clues/${clueId}`, {
      method: "DELETE",
    }),
};
