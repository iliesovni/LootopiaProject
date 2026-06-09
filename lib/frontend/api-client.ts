export type AuthUser = {
  id: string
  email: string
  username: string
  role: 'PLAYER' | 'PARTNER' | 'ADMIN'
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

import { ApiClientError, parseApiResponse } from '@/lib/frontend/api-request'

export { ApiClientError }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  })

  return parseApiResponse<T>(response)
}

export type RegisterInput = {
  email: string
  username: string
  password: string
}

export type LoginInput = {
  identifier: string
  password: string
}

// Hunt types
export type HuntPublicList = {
  id: string
  title: string
  description: string | null
  location: string
  difficulty: string
  bannerUrl: string | null
  createdAt: string
  startLat: number
  startLng: number
  createdBy: {
    username: string
  }
  _count: {
    steps: number
  }
}

export type HuntPublicDetail = HuntPublicList

export type HuntOwnerDetail = {
  id: string
  title: string
  description: string | null
  location: string
  difficulty: string
  bannerUrl: string | null
  mode: string
  status: string
  visibility: string
  accessCode: string | null
  isDeleted: boolean
  createdById: string
  partnerId: string | null
  startLat: number
  startLng: number
  createdBy: {
    id: string
    username: string
    role: string
  }
  steps: Array<{
    id: string
    title: string
    description: string
    latitude: number
    longitude: number
    radiusMeters: number
    pointsReward: number
    orderIndex: number
    clues: Array<{
      id: string
      content: string
      penaltyPoints: number
      orderIndex: number
    }>
    _count: {
      clues: number
    }
  }>
}

export type CreateHuntInput = {
  title: string
  description?: string | null
  location: string
  difficulty: string
  visibility?: string
  accessCode?: string
  startLat: number
  startLng: number
}

export type UpdateHuntInput = Partial<CreateHuntInput>

// Participation types
export type ParticipationPublic = {
  id: string
  status: string
  totalScore: number
  startedAt: string
  completedAt: string | null
  huntId: string
  userId: string
  hunt: {
    id: string
    title: string
    location: string | null
    difficulty: string | null
    bannerUrl: string | null
  } | null
  stepProgress: Array<{
    stepId: string
    isCompleted: boolean
    cluesUsed: number
    pointsEarned: number
    completedAt: string | null
    step: {
      id: string
      title: string
      orderIndex: number
      pointsReward: number
    } | null
  }>
}

export type StartParticipationInput = {
  huntId: string
  accessCode?: string | null
}

export type CompleteStepInput = {
  stepId: string
}

export type UseClueInput = {
  stepId: string
}

// Step/Clue types
export type CreateStepInput = {
  title: string
  description: string
  latitude: number
  longitude: number
  radiusMeters: number
  orderIndex: number
  pointsReward: number
  huntId: string
  arMarkerType?: string | null
  arAssetUrl?: string | null
}

export type UpdateStepInput = Partial<Omit<CreateStepInput, 'huntId'>>

export type CreateClueInput = {
  content: string
  penaltyPoints: number
  stepId: string
  orderIndex?: number
}

export type UpdateClueInput = Partial<CreateClueInput>

export const apiClient = {
  // Auth
  register: (input: RegisterInput) =>
    request<AuthUser>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  login: (input: LoginInput) =>
    request<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  me: () => request<AuthUser>('/api/auth/me', { method: 'GET' }),
  logout: () =>
    request<void>('/api/auth/logout', {
      method: 'POST',
    }),

  // Hunts - Public
  listPublicHunts: () =>
    request<{ count: number; items: HuntPublicList[] }>('/api/hunts', {
      method: 'GET',
    }),
  getHuntDetail: (huntId: string) =>
    request<HuntPublicDetail | HuntOwnerDetail>(`/api/hunts/${huntId}`, {
      method: 'GET',
    }),

  // Hunts - Creator
  listMyHunts: async () => {
    const hunts = await request<HuntOwnerDetail[]>('/api/me/hunts', {
      method: 'GET',
    })
    return {
      count: hunts?.length ?? 0,
      items: hunts ?? [],
    }
  },
  createHunt: (input: CreateHuntInput) =>
    request<HuntOwnerDetail>('/api/hunts', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateHunt: (huntId: string, input: UpdateHuntInput) =>
    request<HuntOwnerDetail>(`/api/hunts/${huntId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteHunt: (huntId: string) =>
    request<void>(`/api/hunts/${huntId}`, {
      method: 'DELETE',
    }),
  publishHunt: (huntId: string) =>
    request<HuntOwnerDetail>(`/api/hunts/${huntId}/publish`, {
      method: 'POST',
    }),

  // Participations
  listMyParticipations: async () => {
    const participations = await request<ParticipationPublic[]>('/api/me/participations', {
      method: 'GET',
    })
    return {
      count: participations?.length ?? 0,
      items: participations ?? [],
    }
  },
  startParticipation: (input: StartParticipationInput) =>
    request<ParticipationPublic>('/api/participations/start', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getParticipation: (participationId: string) =>
    request<ParticipationPublic>(`/api/participations/${participationId}`, {
      method: 'GET',
    }),
  completeStep: (participationId: string, input: CompleteStepInput) =>
    request<ParticipationPublic>(`/api/participations/${participationId}/complete-step`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  useClue: (participationId: string, input: UseClueInput) =>
    request<ParticipationPublic>(`/api/participations/${participationId}/use-clue`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  finishParticipation: (participationId: string) =>
    request<ParticipationPublic>(`/api/participations/${participationId}/finish`, {
      method: 'POST',
    }),

  getStep: (stepId: string) =>
    request<any>(`/api/steps/${stepId}`, {
      method: 'GET',
    }),
  listStepClues: async (stepId: string) => {
    const result = await request<{ count: number; items: any[] }>(
      `/api/steps/${stepId}/clues`,
      { method: 'GET' },
    )
    return result?.items ?? []
  },

  // Steps
  createStep: (huntId: string, input: CreateStepInput) =>
    request<any>(`/api/hunts/${huntId}/steps`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateStep: (stepId: string, input: UpdateStepInput) =>
    request<any>(`/api/steps/${stepId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteStep: (stepId: string) =>
    request<void>(`/api/steps/${stepId}`, {
      method: 'DELETE',
    }),

  // Clues
  createClue: (input: CreateClueInput) =>
    request<any>('/api/clues', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateClue: (clueId: string, input: UpdateClueInput) =>
    request<any>(`/api/clues/${clueId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteClue: (clueId: string) =>
    request<void>(`/api/clues/${clueId}`, {
      method: 'DELETE',
    }),
}
