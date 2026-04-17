import type { Profession } from '@prisma/client'
import { optionToScoredAnswer, scoreAnswers } from './answerScoring.js'
import { rankProfessions } from './professionRanking.js'
import { buildFinalResult } from './resultNormalization.js'
import type { ScoredAnswer } from './types.js'

export { optionToScoredAnswer }

export function computeResult(scoredAnswers: ScoredAnswer[], professions: Profession[]) {
  const profile = scoreAnswers(scoredAnswers)
  const ranked = rankProfessions(profile.vector, profile.tagScores, professions)

  return buildFinalResult({
    userTraits: profile.vector,
    tagScores: profile.tagScores,
    dominantTraits: profile.dominantTraits,
    profileClarity: profile.profileClarity,
    ranked,
  })
}
