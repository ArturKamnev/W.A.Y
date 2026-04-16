import { env } from '../config/env'
import type { AuthSession } from '../types/models'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  auth?: 'none' | 'required'
}

const AUTH_STORAGE_KEY = 'way.auth.v1'
const AUTH_EXPIRED_EVENT = 'way:auth-expired'

export class ApiAuthError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'ApiAuthError'
  }
}

export function clearPersistedSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function getPersistedSession(): AuthSession | null {
  try {
    const value = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!value) return null
    const parsed = JSON.parse(value) as { state?: { session?: AuthSession | null } }
    const session = parsed.state?.session
    if (!session?.token || !session.expiresAt || Number.isNaN(Date.parse(session.expiresAt))) {
      clearPersistedSession()
      return null
    }
    if (Date.parse(session.expiresAt) <= Date.now()) {
      clearPersistedSession()
      return null
    }
    return session
  } catch {
    clearPersistedSession()
    return null
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  const authMode = options.auth ?? 'none'
  if (authMode === 'required') {
    const session = getPersistedSession()
    if (!session?.token) {
      clearPersistedSession()
      throw new ApiAuthError()
    }
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let message = `API request failed with ${response.status}`
    try {
      const payload = (await response.json()) as { message?: string; detail?: string; error?: string }
      if (payload.message) message = payload.message
      if (payload.detail) message = payload.detail
      if (payload.error) message = payload.error
    } catch {
      // Keep the transport-level message if the response is empty.
    }
    if (response.status === 401 && authMode === 'required') {
      clearPersistedSession()
      throw new ApiAuthError(message)
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, options?: Pick<RequestOptions, 'auth' | 'headers'>) => request<T>(path, options),
  post: <T>(path: string, body: unknown, options?: Pick<RequestOptions, 'auth' | 'headers'>) =>
    request<T>(path, { method: 'POST', body, ...options }),
  patch: <T>(path: string, body: unknown, options?: Pick<RequestOptions, 'auth' | 'headers'>) =>
    request<T>(path, { method: 'PATCH', body, ...options }),
  put: <T>(path: string, body: unknown, options?: Pick<RequestOptions, 'auth' | 'headers'>) =>
    request<T>(path, { method: 'PUT', body, ...options }),
  delete: <T>(path: string, options?: Pick<RequestOptions, 'auth' | 'headers'>) =>
    request<T>(path, { method: 'DELETE', ...options }),
}
