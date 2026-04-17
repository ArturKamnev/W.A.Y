import type { TestQuestionOption } from '@prisma/client'
import { addWeights, createEmptyTraitVector, normalizeTraitVector, tagTraitWeights, topTraitKeys } from './traitCatalog.js'
import { traitKeys } from './types.js'
import type { ScoredAnswer, ScoredTraitProfile } from './types.js'

export function optionToScoredAnswer(option: TestQuestionOption): ScoredAnswer {
  const payload = option.scoringPayload as { tags?: string[] }
  return { value: option.value, tags: payload.tags ?? [] }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function calculateProfileClarity(vector: Record<string, number>) {
  const values = traitKeys.map((key) => vector[key])
  const topValues = [...values].sort((first, second) => second - first)
  const topAverage = topValues.slice(0, 4).reduce((total, value) => total + value, 0) / 4
  const lowerAverage = topValues.slice(7).reduce((total, value) => total + value, 0) / Math.max(1, topValues.length - 7)
  const activeTraitCount = values.filter((value) => value >= topAverage * 0.72 && value > 0).length
  const spread = topAverage > 0 ? (topAverage - lowerAverage) / topAverage : 0
  const focusPenalty = Math.max(0, activeTraitCount - 6) * 0.055

  return Number(clamp(0.48 + spread * 0.58 - focusPenalty, 0.38, 1).toFixed(4))
}

export function scoreAnswers(answers: ScoredAnswer[]): ScoredTraitProfile {
  const vector = createEmptyTraitVector()
  const tagScores: Record<string, number> = {}

  for (const answer of answers) {
    const normalizedValue = Math.max(1, Math.min(answer.value, 4))
    const intensityByValue: Record<number, number> = {
      1: 0,
      2: 0.38,
      3: 0.72,
      4: 1,
    }
    const intensity = intensityByValue[normalizedValue] ?? 0

    for (const tag of answer.tags) {
      tagScores[tag] = Number(((tagScores[tag] ?? 0) + intensity).toFixed(4))
      addWeights(vector, tagTraitWeights[tag] ?? {}, intensity)
    }
  }

  const normalizedVector = normalizeTraitVector(vector)
  const profileClarity = calculateProfileClarity(normalizedVector)

  return {
    vector: normalizedVector,
    tagScores,
    dominantTraits: topTraitKeys(normalizedVector, 5),
    profileClarity,
  }
}
