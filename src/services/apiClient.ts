import { env } from '../config/env'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

function getPersistedToken() {
  try {
    const value = localStorage.getItem('way.auth.v1')
    if (!value) return undefined
    const parsed = JSON.parse(value) as { state?: { session?: { token?: string } } }
    return parsed.state?.session?.token
  } catch {
    return undefined
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  const token = getPersistedToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let message = `API request failed with ${response.status}`
    try {
      const payload = (await response.json()) as { message?: string }
      if (payload.message) message = payload.message
    } catch {
      // Keep the transport-level message if the response is empty.
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
