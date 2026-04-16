import { apiClient, getPersistedSession } from './apiClient'
import type {
  AdminStats,
  AdminUser,
  AuthSession,
  ChatConversation,
  ChatMessage,
  GuideTopic,
  Profession,
  ProfessionFilters,
  Question,
  SignInRequest,
  SignUpRequest,
  TestResult,
  TestSubmission,
  UserProfile,
} from '../types/models'

export const apiAuthService = {
  signIn: (request: SignInRequest) => apiClient.post<AuthSession>('/auth/login', request, { auth: 'none' }),
  signUp: (request: SignUpRequest) => apiClient.post<AuthSession>('/auth/signup', request, { auth: 'none' }),
  signOut: () => apiClient.post<void>('/auth/logout', {}, { auth: 'none' }),
  async getSession(): Promise<AuthSession> {
    const persisted = getPersistedSession()
    const response = await apiClient.get<{ user: UserProfile }>('/auth/me', { auth: 'required' })
    return {
      user: response.user,
      token: persisted?.token ?? '',
      refreshToken: persisted?.refreshToken,
      expiresAt: persisted?.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  },
}

export const apiQuestionService = {
  getQuestions: () => apiClient.get<Question[]>('/test/questions', { auth: 'none' }),
}

export const apiResultService = {
  async submitTest(submission: TestSubmission): Promise<TestResult> {
    return apiClient.post<TestResult>('/test/submit', submission, { auth: 'required' })
  },
  getLatestResult: () => apiClient.get<TestResult>('/test/results/latest', { auth: 'required' }),
}

export const apiProfessionService = {
  async listProfessions(filters: ProfessionFilters = {}) {
    const params = new URLSearchParams()
    if (filters.category) params.set('category', filters.category)
    if (filters.query) params.set('query', filters.query)
    const query = params.toString()
    return apiClient.get<Profession[]>(`/professions${query ? `?${query}` : ''}`, { auth: 'none' })
  },
  getProfession: (id: string) => apiClient.get<Profession>(`/professions/${id}`, { auth: 'none' }),
  saveProfession: (professionId: string) =>
    apiClient.post<{ saved: boolean; professionId: string }>('/professions/save', { professionId }, { auth: 'required' }),
  removeProfession: (professionId: string) => apiClient.delete<void>(`/professions/save/${professionId}`, { auth: 'required' }),
  listSavedProfessions: () => apiClient.get<Profession[]>('/professions/saved', { auth: 'required' }),
}

export const apiProfileService = {
  getProfile: () => apiClient.get<UserProfile>('/profile', { auth: 'required' }),
  updateProfile: (profile: Partial<Pick<UserProfile, 'name' | 'grade' | 'preferredLanguage'>>) =>
    apiClient.patch<UserProfile>('/profile', profile, { auth: 'required' }),
}

export const apiGuideService = {
  listTopics: () => apiClient.get<GuideTopic[]>('/guide/topics', { auth: 'required' }),
  listConversations: () => apiClient.get<ChatConversation[]>('/guide/conversations', { auth: 'required' }),
  createConversation: (title?: string) => apiClient.post<ChatConversation>('/guide/conversations', { title }, { auth: 'required' }),
  sendMessage(conversationId: string, content: string): Promise<{ user: ChatMessage; guide: ChatMessage }> {
    return apiClient.post(`/guide/conversations/${conversationId}/messages`, { message: content }, { auth: 'required' })
  },
}

export const apiAdminService = {
  getStats: () => apiClient.get<AdminStats>('/admin/stats', { auth: 'required' }),
  listUsers: (filters: { search?: string; role?: 'user' | 'admin' } = {}) => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.role) params.set('role', filters.role)
    const query = params.toString()
    return apiClient.get<AdminUser[]>(`/admin/users${query ? `?${query}` : ''}`, { auth: 'required' })
  },
  getUser: (id: string) => apiClient.get<AdminUser>(`/admin/users/${id}`, { auth: 'required' }),
  setUserStatus: (id: string, isActive: boolean) =>
    apiClient.patch<AdminUser>(`/admin/users/${id}/status`, { isActive }, { auth: 'required' }),
  setUserRole: (id: string, role: 'user' | 'admin') =>
    apiClient.patch<AdminUser>(`/admin/users/${id}/role`, { role }, { auth: 'required' }),
}
