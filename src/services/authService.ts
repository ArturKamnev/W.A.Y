import { demoUser } from '../data/mockData'
import type { AuthSession, SignInRequest, SignUpRequest } from '../types/models'

const wait = (ms = 240) => new Promise((resolve) => setTimeout(resolve, ms))

function makeSession(user = demoUser): AuthSession {
  return {
    user,
    token: `mock-token-${user.id}`,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
  }
}

export const authService = {
  async signIn(request: SignInRequest): Promise<AuthSession> {
    void request
    await wait()
    return makeSession()
  },

  async signUp(request: SignUpRequest): Promise<AuthSession> {
    await wait()
    return makeSession({
      ...demoUser,
      id: `user-${Date.now()}`,
      name: request.name,
      email: request.email,
      grade: request.grade,
      preferredLanguage: request.preferredLanguage,
    })
  },

  async signOut(): Promise<void> {
    await wait(120)
  },

  async getSession(): Promise<AuthSession> {
    await wait(100)
    return makeSession()
  },
}
