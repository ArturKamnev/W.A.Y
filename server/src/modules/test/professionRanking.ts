import type { Profession } from '@prisma/client'
import {
  addWeights,
  categoryFallbackWeights,
  createEmptyTraitVector,
  normalizeTraitVector,
  tagTraitWeights,
  topTraitKeys,
} from './traitCatalog.js'
import { traitKeys, type ProfessionTraitProfile, type RankedProfessionResult, type TraitVector } from './types.js'

function cosineSimilarity(first: TraitVector, second: TraitVector) {
  let dot = 0
  let firstLength = 0
  let secondLength = 0

  for (const key of traitKeys) {
    dot += first[key] * second[key]
    firstLength += first[key] ** 2
    secondLength += second[key] ** 2
  }

  if (firstLength === 0 || secondLength === 0) return 0
  return dot / (Math.sqrt(firstLength) * Math.sqrt(secondLength))
}

function professionCoverage(userVector: TraitVector, professionVector: TraitVector) {
  let overlap = 0
  let expected = 0

  for (const key of traitKeys) {
    overlap += Math.min(userVector[key], professionVector[key])
    expected += professionVector[key]
  }

  return expected > 0 ? overlap / expected : 0
}

function tagOverlap(profession: Profession, tagScores: Record<string, number>) {
  const raw = profession.scoringTags.reduce((total, tag) => total + (tagScores[tag] ?? 0), 0)
  const max = Math.max(1, ...Object.values(tagScores))
  return Math.min(1, raw / (max * Math.max(2, profession.scoringTags.length * 0.5)))
}

export function buildProfessionProfile(profession: Profession): ProfessionTraitProfile {
  const vector = createEmptyTraitVector()

  for (const tag of profession.scoringTags) {
    addWeights(vector, tagTraitWeights[tag] ?? {}, 1)
  }

  addWeights(vector, categoryFallbackWeights[profession.category] ?? {}, 0.65)

  return {
    profession,
    sourceTags: profession.scoringTags,
    vector: normalizeTraitVector(vector),
  }
}

export function rankProfessions(
  userVector: TraitVector,
  tagScores: Record<string, number>,
  professions: Profession[],
): RankedProfessionResult[] {
  return professions
    .map((profession) => {
      const profile = buildProfessionProfile(profession)
      const cosine = cosineSimilarity(userVector, profile.vector)
      const coverage = professionCoverage(userVector, profile.vector)
      const directTags = tagOverlap(profession, tagScores)
      const score = cosine * 0.68 + coverage * 0.22 + directTags * 0.1
      const sharedVector = Object.fromEntries(
        traitKeys.map((key) => [key, Math.min(userVector[key], profile.vector[key])]),
      ) as TraitVector

      return {
        profession,
        score: Number(score.toFixed(5)),
        matchPercent: 0,
        rank: 0,
        sharedTraits: topTraitKeys(sharedVector, 3),
      }
    })
    .sort((first, second) => {
      if (second.score !== first.score) return second.score - first.score
      return first.profession.slug.localeCompare(second.profession.slug)
    })
    .map((result, index) => ({ ...result, rank: index + 1 }))
}
