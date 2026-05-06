export type AuthUser = {
  id: string
  email: string
  username: string
  role: 'PLAYER' | 'PARTNER' | 'ADMIN'
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

type ApiSuccess<T> = {
  success?: true
  message?: string
  data?: T
}

type ApiErrorObject = {
  code?: string
  message?: string
}

type ApiErrorResponse = {
  success?: false
  message?: string
  error?: string | ApiErrorObject
  data?: unknown
}

export class ApiClientError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(message: string, status: number, code = 'UNKNOWN_ERROR', details?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  })

  const rawBody = await parseResponseBody(response)

  if (!response.ok) {
    const body = (rawBody ?? {}) as ApiErrorResponse
    const errorObject = typeof body.error === 'string' ? { message: body.error } : (body.error ?? {})
    throw new ApiClientError(
      errorObject.message ?? body.message ?? 'Une erreur est survenue.',
      response.status,
      errorObject.code ?? 'API_ERROR',
      body.data
    )
  }

  const body = (rawBody ?? {}) as ApiSuccess<T>
  if (body.data !== undefined) {
    return body.data
  }
  return undefined as T
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

export const apiClient = {
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
}
