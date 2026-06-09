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

  constructor(
    message: string,
    status: number,
    code = "UNKNOWN_ERROR",
    details?: unknown,
  ) {
    super(message)
    this.name = "ApiClientError"
    this.status = status
    this.code = code
    this.details = details
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    return null
  }
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const rawBody = await parseResponseBody(response)

  if (!response.ok) {
    const body = (rawBody ?? {}) as ApiErrorResponse
    const errorObject =
      typeof body.error === "string" ? { message: body.error } : (body.error ?? {})
    throw new ApiClientError(
      errorObject.message ?? body.message ?? "Une erreur est survenue.",
      response.status,
      errorObject.code ?? "API_ERROR",
      body.data,
    )
  }

  const body = (rawBody ?? {}) as ApiSuccess<T>
  if (body.data !== undefined) {
    return body.data
  }
  return undefined as T
}
