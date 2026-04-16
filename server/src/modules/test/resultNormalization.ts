import { traitLabels } from './traitCatalog.js'
import type { CareerTestDeterministicResult, RankedProfessionResult, TraitKey, TraitVector } from './types.js'

const roadmap = [
  { id: 'roadmap-1', titleKey: 'results.roadmap.step1.title', descriptionKey: 'results.roadmap.step1.description', status: 'next' as const },
  { id: 'roadmap-2', titleKey: 'results.roadmap.step2.title', descriptionKey: 'results.roadmap.step2.description', status: 'later' as const },
  { id: 'roadmap-3', titleKey: 'results.roadmap.step3.title', descriptionKey: 'results.roadmap.step3.description', status: 'later' as const },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeMatchPercents(ranked: RankedProfessionResult[]): RankedProfessionResult[] {
  const scores = ranked.map((item) => item.score)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const spread = Math.max(0.0001, maxScore - minScore)

  return ranked.map((item, index) => {
    const relative = (item.score - minScore) / spread
    const scoreConfidence = clamp(item.score, 0, 1)
    const rankAdjustment = Math.max(0, 4 - index) * 0.9
    const matchPercent = Math.round(clamp(56 + scoreConfidence * 28 + relative * 12 + rankAdjustment, 52, 97))

    return { ...item, matchPercent }
  })
}

function listTraitsRu(keys: TraitKey[]) {
  return keys.map((key) => traitLabels[key].ru.toLowerCase()).join(', ')
}

function listTraitsEn(keys: TraitKey[]) {
  return keys.map((key) => traitLabels[key].en.toLowerCase()).join(', ')
}

function buildRecommendationReason(result: RankedProfessionResult) {
  const ruTraits = listTraitsRu(result.sharedTraits)
  const enTraits = listTraitsEn(result.sharedTraits)

  return {
    reasonRu: ruTraits
      ? `Совпадение связано с выраженными признаками: ${ruTraits}.`
      : 'Совпадение рассчитано по общему профилю ответов.',
    reasonEn: enTraits
      ? `The match is connected to stronger signals in ${enTraits}.`
      : 'The match is calculated from the overall answer profile.',
  }
}

function chooseWorkStyle(dominantTraits: TraitKey[]) {
  if (dominantTraits.includes('teamwork') || dominantTraits.includes('communication')) {
    return {
      key: 'results.workStyle',
      ru: 'Вам может подходить работа, где идеи обсуждаются с людьми, но решения остаются структурными и понятными.',
      en: 'You may fit work where ideas are discussed with people while decisions stay structured and clear.',
    }
  }

  if (dominantTraits.includes('independence') || dominantTraits.includes('researchOrientation')) {
    return {
      key: 'results.workStyle',
      ru: 'Вам может подходить спокойная самостоятельная работа с глубоким фокусом и ясными критериями результата.',
      en: 'You may fit calm independent work with deep focus and clear success criteria.',
    }
  }

  return {
    key: 'results.workStyle',
    ru: 'Вам может подходить сбалансированный формат: понятные шаги, видимый прогресс и пространство для инициативы.',
    en: 'You may fit a balanced format with clear steps, visible progress, and room for initiative.',
  }
}

function chooseEnvironment(dominantTraits: TraitKey[]) {
  if (dominantTraits.includes('technicalInterest')) {
    return {
      key: 'results.environment',
      ru: 'Комфортной может быть цифровая среда с современными инструментами, задачами на логику и быстрым результатом.',
      en: 'A digital environment with modern tools, logical challenges, and visible results may feel comfortable.',
    }
  }

  if (dominantTraits.includes('helpingPeople')) {
    return {
      key: 'results.environment',
      ru: 'Комфортной может быть среда, где есть живое общение, доверие и понятная польза для людей.',
      en: 'An environment with live communication, trust, and clear value for people may feel comfortable.',
    }
  }

  if (dominantTraits.includes('researchOrientation')) {
    return {
      key: 'results.environment',
      ru: 'Комфортной может быть исследовательская среда с фактами, экспериментами и вниманием к точности.',
      en: 'A research environment with evidence, experiments, and attention to precision may feel comfortable.',
    }
  }

  return {
    key: 'results.environment',
    ru: 'Комфортной может быть среда, где сочетаются ясность, поддержка и возможность пробовать разные подходы.',
    en: 'An environment that combines clarity, support, and room to try different approaches may feel comfortable.',
  }
}

function chooseDirections(dominantTraits: TraitKey[]) {
  const directions = []

  if (dominantTraits.includes('technicalInterest') || dominantTraits.includes('logic')) {
    directions.push({ key: 'results.directions.digitalProducts', ru: 'Цифровые продукты и технологии', en: 'Digital products and technology' })
  }
  if (dominantTraits.includes('researchOrientation') || dominantTraits.includes('analyticalThinking')) {
    directions.push({ key: 'results.directions.humanResearch', ru: 'Исследования, данные и доказательная работа', en: 'Research, data, and evidence-based work' })
  }
  if (dominantTraits.includes('creativity') || dominantTraits.includes('visualInterest')) {
    directions.push({ key: 'results.directions.digitalProducts', ru: 'Дизайн опыта и визуальные системы', en: 'Experience design and visual systems' })
  }
  if (dominantTraits.includes('helpingPeople') || dominantTraits.includes('communication')) {
    directions.push({ key: 'results.directions.learningDesign', ru: 'Обучение, коммуникация и помощь людям', en: 'Learning, communication, and helping people' })
  }
  if (dominantTraits.includes('leadership') || dominantTraits.includes('organization')) {
    directions.push({ key: 'results.directions.digitalProducts', ru: 'Продуктовое и организационное направление', en: 'Product and organizational direction' })
  }

  return directions.slice(0, 3)
}

export function buildFinalResult(input: {
  userTraits: TraitVector
  tagScores: Record<string, number>
  dominantTraits: TraitKey[]
  ranked: RankedProfessionResult[]
}): CareerTestDeterministicResult {
  const normalized = normalizeMatchPercents(input.ranked)
  const selected = normalized.slice(0, 4)
  const primary = selected[0]
  const alternatives = selected.slice(1, 4)
  const dominantLabels = input.dominantTraits.slice(0, 3).map((key) => traitLabels[key])
  const recommendations = selected.map((item) => ({ ...item, ...buildRecommendationReason(item) }))
  const topTraitRu = listTraitsRu(input.dominantTraits.slice(0, 3))
  const topTraitEn = listTraitsEn(input.dominantTraits.slice(0, 3))

  return {
    userTraits: input.userTraits,
    tagScores: input.tagScores,
    dominantTraits: input.dominantTraits,
    primary,
    alternatives,
    recommendations,
    profileTitleKey: 'results.profileTitle',
    summaryRu: `Лучшее совпадение - ${primary.profession.titleRu}. Расчет опирается на ответы, где сильнее всего проявились: ${topTraitRu}.`,
    summaryEn: `The strongest match is ${primary.profession.titleEn}. The calculation is based on answers where these signals were strongest: ${topTraitEn}.`,
    strengths: dominantLabels,
    workStyle: chooseWorkStyle(input.dominantTraits),
    preferredEnvironment: chooseEnvironment(input.dominantTraits),
    recommendedDirections: chooseDirections(input.dominantTraits),
    roadmap,
  }
}
