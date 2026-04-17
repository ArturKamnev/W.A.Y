import type { Profession } from '@prisma/client'

export const traitKeys = [
  'logic',
  'analyticalThinking',
  'creativity',
  'communication',
  'technicalInterest',
  'helpingPeople',
  'structure',
  'teamwork',
  'independence',
  'visualInterest',
  'researchOrientation',
  'leadership',
  'organization',
  'curiosity',
  'persistence',
] as const

export type TraitKey = (typeof traitKeys)[number]
export type TraitVector = Record<TraitKey, number>

export interface ScoredAnswer {
  value: number
  tags: string[]
}

export interface TraitLabel {
  key: string
  ru: string
  en: string
}

export interface ScoredTraitProfile {
  vector: TraitVector
  tagScores: Record<string, number>
  dominantTraits: TraitKey[]
}

export interface ProfessionTraitProfile {
  profession: Profession
  vector: TraitVector
  sourceTags: string[]
}

export interface RankedProfessionResult {
  profession: Profession
  score: number
  matchPercent: number
  rank: number
  sharedTraits: TraitKey[]
}

export interface CareerTestDeterministicResult {
  userTraits: TraitVector
  tagScores: Record<string, number>
  dominantTraits: TraitKey[]
  primary: RankedProfessionResult
  alternatives: RankedProfessionResult[]
  recommendations: Array<RankedProfessionResult & { reasonRu: string; reasonEn: string }>
  profileTitleKey: string
  summaryRu: string
  summaryEn: string
  reasoningRu: string[]
  reasoningEn: string[]
  strengths: TraitLabel[]
  workStyle: TraitLabel
  preferredEnvironment: TraitLabel
  recommendedDirections: TraitLabel[]
  roadmap: Array<{ id: string; titleKey: string; descriptionKey: string; status: 'next' | 'later' | 'done' }>
}

export interface AIExplanationResponse {
  primaryProfessionSlug: string
  primaryMatchPercent: number
  alternatives: Array<{ slug: string; matchPercent: number }>
  summary: string
  reasoning: string[]
}
