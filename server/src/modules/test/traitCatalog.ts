import type { TraitKey, TraitLabel, TraitVector } from './types.js'
import { traitKeys } from './types.js'

export const traitLabels: Record<TraitKey, TraitLabel> = {
  logic: { key: 'results.traits.logic', ru: 'Логическое мышление', en: 'Logical thinking' },
  analyticalThinking: { key: 'results.traits.analyticalThinking', ru: 'Аналитическое мышление', en: 'Analytical thinking' },
  creativity: { key: 'results.traits.creativity', ru: 'Креативность', en: 'Creativity' },
  communication: { key: 'results.traits.communication', ru: 'Коммуникация', en: 'Communication' },
  technicalInterest: { key: 'results.traits.technicalInterest', ru: 'Интерес к технологиям', en: 'Technical interest' },
  helpingPeople: { key: 'results.traits.helpingPeople', ru: 'Помощь людям', en: 'Helping people' },
  structure: { key: 'results.traits.structure', ru: 'Структурность', en: 'Structure' },
  teamwork: { key: 'results.traits.teamwork', ru: 'Командная работа', en: 'Teamwork' },
  independence: { key: 'results.traits.independence', ru: 'Самостоятельность', en: 'Independence' },
  visualInterest: { key: 'results.traits.visualInterest', ru: 'Визуальное мышление', en: 'Visual thinking' },
  researchOrientation: { key: 'results.traits.researchOrientation', ru: 'Исследовательский интерес', en: 'Research orientation' },
  leadership: { key: 'results.traits.leadership', ru: 'Лидерство', en: 'Leadership' },
  organization: { key: 'results.traits.organization', ru: 'Организация', en: 'Organization' },
  curiosity: { key: 'results.traits.curiosity', ru: 'Любопытство', en: 'Curiosity' },
  persistence: { key: 'results.traits.persistence', ru: 'Настойчивость', en: 'Persistence' },
  adaptability: { key: 'results.traits.adaptability', ru: 'Гибкость к изменениям', en: 'Adaptability' },
}

export const tagTraitWeights: Record<string, Partial<TraitVector>> = {
  logic: { logic: 1, analyticalThinking: 0.45, technicalInterest: 0.25, persistence: 0.2 },
  analysis: { analyticalThinking: 1, logic: 0.55, structure: 0.3, persistence: 0.2 },
  statistics: { analyticalThinking: 0.95, logic: 0.55, organization: 0.2 },
  patterns: { analyticalThinking: 0.85, logic: 0.65, curiosity: 0.2 },
  precision: { analyticalThinking: 0.45, structure: 0.75, researchOrientation: 0.35, persistence: 0.35 },
  technology: { technicalInterest: 1, logic: 0.55, structure: 0.25, curiosity: 0.25 },
  systems: { technicalInterest: 0.8, logic: 0.7, structure: 0.45 },
  digital: { technicalInterest: 0.85, visualInterest: 0.35, logic: 0.25 },
  building: { technicalInterest: 0.75, logic: 0.45, independence: 0.35, persistence: 0.3 },
  deepFocus: { independence: 0.75, logic: 0.55, technicalInterest: 0.35, persistence: 0.45 },
  creative: { creativity: 1, visualInterest: 0.55, communication: 0.2 },
  design: { visualInterest: 1, creativity: 0.75, helpingPeople: 0.25 },
  visual: { visualInterest: 1, creativity: 0.55 },
  studio: { creativity: 0.85, visualInterest: 0.75, teamwork: 0.25 },
  expression: { creativity: 0.9, communication: 0.55 },
  storytelling: { communication: 0.75, creativity: 0.6, helpingPeople: 0.25 },
  writing: { communication: 0.75, creativity: 0.45, structure: 0.25 },
  research: { researchOrientation: 1, analyticalThinking: 0.65, independence: 0.25, curiosity: 0.6 },
  science: { researchOrientation: 0.95, analyticalThinking: 0.65, structure: 0.35, curiosity: 0.45 },
  experiments: { researchOrientation: 0.85, analyticalThinking: 0.5, creativity: 0.25, curiosity: 0.45, adaptability: 0.25 },
  discovery: { researchOrientation: 0.9, creativity: 0.25, independence: 0.25, curiosity: 1 },
  lab: { researchOrientation: 0.8, structure: 0.55, analyticalThinking: 0.35 },
  people: { helpingPeople: 0.95, communication: 0.55, teamwork: 0.25 },
  empathy: { helpingPeople: 1, communication: 0.45 },
  social: { helpingPeople: 0.85, teamwork: 0.55, communication: 0.3 },
  impact: { helpingPeople: 0.8, leadership: 0.35, communication: 0.25 },
  listening: { helpingPeople: 0.85, communication: 0.6, structure: 0.15 },
  teaching: { communication: 0.85, helpingPeople: 0.75, structure: 0.25 },
  community: { teamwork: 0.75, helpingPeople: 0.65, communication: 0.35 },
  communication: { communication: 1, teamwork: 0.35 },
  presentation: { communication: 0.85, leadership: 0.5 },
  negotiation: { communication: 0.85, leadership: 0.35, analyticalThinking: 0.2 },
  teamwork: { teamwork: 1, communication: 0.45 },
  business: { leadership: 0.75, organization: 0.55, communication: 0.35 },
  leadership: { leadership: 1, communication: 0.35, organization: 0.25 },
  strategy: { leadership: 0.7, analyticalThinking: 0.5, organization: 0.45 },
  planning: { organization: 0.85, structure: 0.7, analyticalThinking: 0.25 },
  operations: { organization: 0.8, structure: 0.75, analyticalThinking: 0.3 },
  market: { leadership: 0.65, communication: 0.45, analyticalThinking: 0.25 },
  growth: { leadership: 0.85, independence: 0.45, communication: 0.2, adaptability: 0.45 },
  fastPaced: { leadership: 0.55, independence: 0.4, organization: 0.25, adaptability: 1 },
  independent: { independence: 1, researchOrientation: 0.35, structure: 0.2, persistence: 0.25 },
  structure: { structure: 1, organization: 0.65 },
  focus: { persistence: 0.85, independence: 0.45, structure: 0.3 },
  resilience: { persistence: 1, helpingPeople: 0.25, leadership: 0.2 },
}

export const categoryFallbackWeights: Record<string, Partial<TraitVector>> = {
  technology: { technicalInterest: 0.85, logic: 0.7, analyticalThinking: 0.45, persistence: 0.25 },
  creative: { creativity: 0.8, visualInterest: 0.75, communication: 0.3 },
  science: { researchOrientation: 0.9, analyticalThinking: 0.7, structure: 0.45, curiosity: 0.45 },
  business: { leadership: 0.75, organization: 0.65, communication: 0.4, adaptability: 0.35 },
  social: { helpingPeople: 0.85, communication: 0.65, teamwork: 0.45 },
  health: { helpingPeople: 0.7, structure: 0.65, researchOrientation: 0.45, persistence: 0.45 },
}

export function createEmptyTraitVector(): TraitVector {
  return Object.fromEntries(traitKeys.map((key) => [key, 0])) as TraitVector
}

export function addWeights(target: TraitVector, weights: Partial<TraitVector>, multiplier = 1) {
  for (const key of traitKeys) {
    target[key] += (weights[key] ?? 0) * multiplier
  }
}

export function normalizeTraitVector(vector: TraitVector): TraitVector {
  const max = Math.max(...traitKeys.map((key) => vector[key]))
  if (max <= 0) return createEmptyTraitVector()

  const normalized = createEmptyTraitVector()
  for (const key of traitKeys) {
    normalized[key] = Number((vector[key] / max).toFixed(4))
  }
  return normalized
}

export function topTraitKeys(vector: TraitVector, count: number): TraitKey[] {
  return [...traitKeys]
    .sort((first, second) => vector[second] - vector[first])
    .filter((key) => vector[key] > 0)
    .slice(0, count)
}
