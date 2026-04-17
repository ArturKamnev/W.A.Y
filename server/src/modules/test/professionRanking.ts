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

const professionTraitAdjustments: Record<string, Partial<TraitVector>> = {
  'ux-designer': {
    visualInterest: 0.9,
    creativity: 0.75,
    helpingPeople: 0.55,
    researchOrientation: 0.55,
    communication: 0.35,
  },
  'frontend-developer': {
    technicalInterest: 1,
    logic: 0.85,
    persistence: 0.7,
    structure: 0.45,
    visualInterest: 0.35,
  },
  'data-analyst': {
    analyticalThinking: 1,
    logic: 0.75,
    structure: 0.55,
    communication: 0.28,
    curiosity: 0.35,
  },
  'research-scientist': {
    researchOrientation: 1,
    curiosity: 0.9,
    persistence: 0.75,
    analyticalThinking: 0.72,
    structure: 0.45,
  },
  'product-manager': {
    leadership: 0.85,
    communication: 0.75,
    organization: 0.72,
    analyticalThinking: 0.45,
    helpingPeople: 0.32,
    adaptability: 0.42,
  },
  'psychologist-educator': {
    helpingPeople: 1,
    communication: 0.72,
    researchOrientation: 0.42,
    structure: 0.35,
  },
  'teacher-mentor': {
    communication: 0.9,
    helpingPeople: 0.82,
    teamwork: 0.55,
    creativity: 0.35,
    persistence: 0.35,
  },
  'medical-specialist': {
    helpingPeople: 0.82,
    structure: 0.78,
    persistence: 0.78,
    researchOrientation: 0.62,
    analyticalThinking: 0.55,
  },
  entrepreneur: {
    leadership: 1,
    independence: 0.72,
    communication: 0.58,
    organization: 0.48,
    creativity: 0.32,
    adaptability: 0.75,
  },
}

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

function userCoverage(userVector: TraitVector, professionVector: TraitVector) {
  let overlap = 0
  let expressed = 0

  for (const key of traitKeys) {
    overlap += Math.min(userVector[key], professionVector[key])
    expressed += userVector[key]
  }

  return expressed > 0 ? overlap / expressed : 0
}

function gapPenalty(userVector: TraitVector, professionVector: TraitVector) {
  let weightedGap = 0
  let requiredWeight = 0

  for (const key of traitKeys) {
    const required = professionVector[key]
    if (required < 0.42) continue
    requiredWeight += required
    weightedGap += Math.max(0, required - userVector[key]) * required
  }

  return requiredWeight > 0 ? weightedGap / requiredWeight : 0
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
  addWeights(vector, professionTraitAdjustments[profession.slug] ?? {}, 1.1)

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
      const requiredCoverage = professionCoverage(userVector, profile.vector)
      const expressedCoverage = userCoverage(userVector, profile.vector)
      const directTags = tagOverlap(profession, tagScores)
      const penalty = gapPenalty(userVector, profile.vector)
      const score = cosine * 0.52 + requiredCoverage * 0.24 + expressedCoverage * 0.14 + directTags * 0.12 - penalty * 0.1
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
