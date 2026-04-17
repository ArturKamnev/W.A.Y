import type { TestQuestionOption } from '@prisma/client'
import { addWeights, createEmptyTraitVector, normalizeTraitVector, tagTraitWeights, topTraitKeys } from './traitCatalog.js'
import type { ScoredAnswer, ScoredTraitProfile } from './types.js'

export function optionToScoredAnswer(option: TestQuestionOption): ScoredAnswer {
  const payload = option.scoringPayload as { tags?: string[] }
  return { value: option.value, tags: payload.tags ?? [] }
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

  return {
    vector: normalizedVector,
    tagScores,
    dominantTraits: topTraitKeys(normalizedVector, 5),
  }
}
