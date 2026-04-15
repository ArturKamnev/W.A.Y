import { apiClient } from './apiClient'
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
  signIn: (request: SignInRequest) => apiClient.post<AuthSession>('/auth/login', request),
  signUp: (request: SignUpRequest) => apiClient.post<AuthSession>('/auth/signup', request),
  signOut: () => apiClient.post<void>('/auth/logout', {}),
  async getSession(): Promise<AuthSession> {
    const response = await apiClient.get<{ user: UserProfile }>('/auth/me')
    return {
      user: response.user,
      token: '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  },
}

export const apiQuestionService = {
  getQuestions: () => apiClient.get<Question[]>('/test/questions'),
}

export const apiResultService = {
  async submitTest(submission: TestSubmission): Promise<TestResult> {
    return apiClient.post<TestResult>('/test/submit', submission)
  },
  getLatestResult: () => apiClient.get<TestResult>('/test/results/latest'),
}

export const apiProfessionService = {
  async listProfessions(filters: ProfessionFilters = {}) {
    const params = new URLSearchParams()
    if (filters.category) params.set('category', filters.category)
    if (filters.query) params.set('query', filters.query)
    const query = params.toString()
    return apiClient.get<Profession[]>(`/professions${query ? `?${query}` : ''}`)
  },
  getProfession: (id: string) => apiClient.get<Profession>(`/professions/${id}`),
  saveProfession: (professionId: string) => apiClient.post<{ saved: boolean; professionId: string }>('/professions/save', { professionId }),
  removeProfession: (professionId: string) => apiClient.delete<void>(`/professions/save/${professionId}`),
  listSavedProfessions: () => apiClient.get<Profession[]>('/professions/saved'),
}

export const apiProfileService = {
  getProfile: () => apiClient.get<UserProfile>('/profile'),
  updateProfile: (profile: Partial<Pick<UserProfile, 'name' | 'grade' | 'preferredLanguage'>>) =>
    apiClient.patch<UserProfile>('/profile', profile),
}

export const apiGuideService = {
  listTopics: () => apiClient.get<GuideTopic[]>('/guide/topics'),
  listConversations: () => apiClient.get<ChatConversation[]>('/guide/conversations'),
  createConversation: (title?: string) => apiClient.post<ChatConversation>('/guide/conversations', { title }),
  sendMessage(conversationId: string, content: string): Promise<{ user: ChatMessage; guide: ChatMessage }> {
    return apiClient.post(`/guide/conversations/${conversationId}/messages`, { message: content })
  },
}

export const apiAdminService = {
  getStats: () => apiClient.get<AdminStats>('/admin/stats'),
  listUsers: (filters: { search?: string; role?: 'user' | 'admin' } = {}) => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.role) params.set('role', filters.role)
    const query = params.toString()
    return apiClient.get<AdminUser[]>(`/admin/users${query ? `?${query}` : ''}`)
  },
  getUser: (id: string) => apiClient.get<AdminUser>(`/admin/users/${id}`),
  setUserStatus: (id: string, isActive: boolean) => apiClient.patch<AdminUser>(`/admin/users/${id}/status`, { isActive }),
  setUserRole: (id: string, role: 'user' | 'admin') => apiClient.patch<AdminUser>(`/admin/users/${id}/role`, { role }),
}
