export type Language = 'en' | 'ru'

export type QuestionCategory =
  | 'interests'
  | 'strengths'
  | 'workStyle'
  | 'communication'
  | 'logicCreativity'
  | 'environment'
  | 'motivation'

export type ProfessionCategory =
  | 'technology'
  | 'creative'
  | 'science'
  | 'business'
  | 'social'
  | 'health'

export interface AnswerOption {
  id: string
  labelKey: string
  value: number
  tags: string[]
}

export interface Question {
  id: string
  category: QuestionCategory
  promptKey: string
  textRu?: string
  textEn?: string
  options: AnswerOption[]
}

export interface TestAnswer {
  questionId: string
  optionId: string
  value: number
  tags: string[]
}

export interface TestSubmission {
  userId?: string
  resultMode?: 'algorithm' | 'ai'
  answers: TestAnswer[]
  completedAt: string
}

export interface CareerRecommendation {
  professionId: string
  matchPercent: number
  reasonKey: string
  reasonRu?: string
  reasonEn?: string
}

export interface RoadmapStep {
  id: string
  titleKey: string
  descriptionKey: string
  status: 'next' | 'later' | 'done'
}

export interface TestResult {
  id: string
  resultMode?: 'algorithm' | 'ai'
  profileTitleKey: string
  summaryKey: string
  summaryRu?: string
  summaryEn?: string
  reasoningRu?: string[]
  reasoningEn?: string[]
  strengthsKeys: string[]
  strengthsText?: Array<{ key?: string; ru?: string; en?: string }>
  workStyleKey: string
  workStyleText?: { key?: string; ru?: string; en?: string }
  environmentKey: string
  environmentText?: { key?: string; ru?: string; en?: string }
  directionKeys: string[]
  directionsText?: Array<{ key?: string; ru?: string; en?: string }>
  primaryRecommendation?: CareerRecommendation
  alternativeRecommendations?: CareerRecommendation[]
  recommendations: CareerRecommendation[]
  roadmap: RoadmapStep[]
  createdAt: string
}

export interface ProfessionDetails {
  doesKey: string
  suitsKey: string
  skillsKeys: string[]
  firstStepsKeys: string[]
  relatedIds: string[]
}

export interface Profession {
  id: string
  databaseId?: string
  category: ProfessionCategory
  titleKey: string
  titleRu?: string
  titleEn?: string
  descriptionKey: string
  descriptionRu?: string
  descriptionEn?: string
  fitTagKey: string
  skillsKeys: string[]
  details: ProfessionDetails
}

export interface GuideTopic {
  id: string
  titleKey: string
  promptKey: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'guide'
  content?: string
  contentKey?: string
  createdAt: string
}

export interface ChatConversation {
  id: string
  titleKey: string
  title?: string
  topicId: string
  messages: ChatMessage[]
  updatedAt: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role?: 'user' | 'admin'
  grade: string
  preferredLanguage: Language
  isActive?: boolean
  avatarUrl: string
  avatarAltKey: string
  recentResultIds: string[]
  savedProfessionIds: string[]
  recentConversationIds: string[]
  roadmap: RoadmapStep[]
}

export interface AuthSession {
  user: UserProfile
  token: string
  expiresAt: string
}

export interface SignInRequest {
  identifier: string
  password: string
}

export interface SignUpRequest {
  name: string
  email: string
  password: string
  grade: string
  preferredLanguage: Language
}

export interface ProfessionFilters {
  category?: ProfessionCategory | 'all'
  query?: string
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  completedTests: number
  savedProfessions: number
  guideConversations: number
  recentSignups: number
}

export interface AdminUser extends UserProfile {
  activity?: {
    tests: number
    savedProfessions: number
    conversations: number
  }
}
