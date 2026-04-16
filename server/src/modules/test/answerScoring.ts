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
    const intensity = Math.max(0, Math.min(answer.value, 4)) / 4

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
