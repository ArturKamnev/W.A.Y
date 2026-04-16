import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockConversations } from '../data/mockData'
import type { AuthSession, ChatConversation, Language, TestAnswer, TestResult } from '../types/models'

export type ThemeMode = 'light' | 'dark'

interface AuthState {
  session: AuthSession | null
  setSession: (session: AuthSession | null) => void
}

interface PreferencesState {
  language: Language
  theme: ThemeMode
  setLanguage: (language: Language) => void
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

interface TestState {
  currentIndex: number
  answers: Record<string, TestAnswer>
  lastSavedAt: string | null
  setCurrentIndex: (index: number) => void
  setAnswer: (answer: TestAnswer) => void
  resetTest: () => void
}

interface SavedItemsState {
  latestResult: TestResult | null
  savedResults: TestResult[]
  savedProfessionIds: string[]
  setLatestResult: (result: TestResult) => void
  saveResult: (result: TestResult) => void
  toggleProfession: (professionId: string) => void
  isProfessionSaved: (professionId: string) => boolean
}

interface GuideState {
  conversations: ChatConversation[]
  activeConversationId: string
  setConversations: (conversations: ChatConversation[]) => void
  setActiveConversationId: (id: string) => void
  appendMessages: (conversationId: string, messages: ChatConversation['messages']) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
    }),
    {
      name: 'way.auth.v1',
      partialize: (state) => ({ session: state.session }),
    },
  ),
)

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: 'ru',
      theme: 'light',
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'way.preferences.v1',
    },
  ),
)

export const useTestStore = create<TestState>()(
  persist(
    (set) => ({
      currentIndex: 0,
      answers: {},
      lastSavedAt: null,
      setCurrentIndex: (currentIndex) => set({ currentIndex }),
      setAnswer: (answer) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [answer.questionId]: answer,
          },
          lastSavedAt: new Date().toISOString(),
        })),
      resetTest: () => set({ currentIndex: 0, answers: {}, lastSavedAt: null }),
    }),
    {
      name: 'way.test-progress.v1',
      partialize: (state) => ({
        currentIndex: state.currentIndex,
        answers: state.answers,
        lastSavedAt: state.lastSavedAt,
      }),
    },
  ),
)

export const useSavedItemsStore = create<SavedItemsState>()(
  persist(
    (set, get) => ({
      latestResult: null,
      savedResults: [],
      savedProfessionIds: [],
      setLatestResult: (latestResult) => set({ latestResult }),
      saveResult: (result) =>
        set((state) => ({
          savedResults: state.savedResults.some((item) => item.id === result.id)
            ? state.savedResults
            : [result, ...state.savedResults],
          latestResult: result,
        })),
      toggleProfession: (professionId) =>
        set((state) => ({
          savedProfessionIds: state.savedProfessionIds.includes(professionId)
            ? state.savedProfessionIds.filter((id) => id !== professionId)
            : [professionId, ...state.savedProfessionIds],
        })),
      isProfessionSaved: (professionId) => get().savedProfessionIds.includes(professionId),
    }),
    {
      name: 'way.saved-items.v1',
    },
  ),
)

export const useGuideStore = create<GuideState>()(
  persist(
    (set) => ({
      conversations: mockConversations,
      activeConversationId: mockConversations[0]?.id ?? '',
      setConversations: (conversations) =>
        set((state) => ({
          conversations,
          activeConversationId: state.activeConversationId || conversations[0]?.id || '',
        })),
      setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
      appendMessages: (conversationId, messages) =>
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  messages: [...conversation.messages, ...messages],
                  updatedAt: new Date().toISOString(),
                }
              : conversation,
          ),
        })),
    }),
    {
      name: 'way.guide.v1',
    },
  ),
)
