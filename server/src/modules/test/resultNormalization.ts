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

export function normalizeMatchPercents(ranked: RankedProfessionResult[], profileClarity = 0.72): RankedProfessionResult[] {
  if (!ranked.length) return []

  const scores = ranked.map((item) => item.score)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const spread = Math.max(0.0001, maxScore - minScore)

  return ranked.map((item, index) => {
    const relative = (item.score - minScore) / spread
    const scoreConfidence = clamp(item.score, 0, 1)
    const rankAdjustment = Math.max(0, 4 - index) * 0.6
    const clarityAdjustment = clamp(profileClarity, 0.38, 1)
    const base = 36 + clarityAdjustment * 9
    const ceiling = 84 + clarityAdjustment * 12
    const matchPercent = Math.round(clamp(base + scoreConfidence * 45 + relative * 5 + rankAdjustment, 34, ceiling))

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
  const professionRu = result.profession.titleRu
  const professionEn = result.profession.titleEn

  return {
    reasonRu: ruTraits
      ? `${professionRu} близок к ответам, где заметнее всего проявились: ${ruTraits}. Процент отражает расчетную близость к профилю профессии, а не гарантию выбора.`
      : 'Совпадение рассчитано по общему профилю ответов.',
    reasonEn: enTraits
      ? `${professionEn} is close to answers where the strongest signals were ${enTraits}. The percentage is calculated profile proximity, not a guarantee.`
      : 'The match is calculated from the overall answer profile.',
  }
}

function chooseWorkStyle(dominantTraits: TraitKey[], userTraits: TraitVector) {
  if (dominantTraits.includes('teamwork') || (dominantTraits.includes('communication') && userTraits.teamwork >= 0.45)) {
    return {
      key: 'results.workStyle',
      ru: 'Вам может подходить формат с обсуждением идей, обратной связью и понятными договоренностями: контакт с людьми есть, но хаоса не должно быть слишком много.',
      en: 'You may fit a format with idea discussion, feedback, and clear agreements: people contact matters, but too much chaos may drain focus.',
    }
  }

  if (dominantTraits.includes('independence') || dominantTraits.includes('researchOrientation') || dominantTraits.includes('persistence')) {
    return {
      key: 'results.workStyle',
      ru: 'Вам может подходить самостоятельная работа с глубоким фокусом, временем на проверку решений и ясными критериями результата.',
      en: 'You may fit independent work with deep focus, time to test decisions, and clear success criteria.',
    }
  }

  return {
    key: 'results.workStyle',
    ru: 'Вам может подходить сбалансированный формат: понятные шаги, видимый прогресс, умеренная самостоятельность и пространство для инициативы.',
    en: 'You may fit a balanced format with clear steps, visible progress, moderate autonomy, and room for initiative.',
  }
}

function chooseEnvironment(dominantTraits: TraitKey[], userTraits: TraitVector) {
  if (dominantTraits.includes('technicalInterest')) {
    return {
      key: 'results.environment',
      ru: 'Комфортной может быть цифровая среда с современными инструментами, логическими задачами, понятными требованиями и быстрым видимым результатом.',
      en: 'A digital environment with modern tools, logical challenges, clear requirements, and visible results may feel comfortable.',
    }
  }

  if (dominantTraits.includes('helpingPeople') || (userTraits.communication >= 0.65 && userTraits.teamwork >= 0.45)) {
    return {
      key: 'results.environment',
      ru: 'Комфортной может быть среда, где есть живое общение, доверие, этичность и понятная польза для людей.',
      en: 'An environment with live communication, trust, ethics, and clear value for people may feel comfortable.',
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
    ru: 'Комфортной может быть среда, где сочетаются ясность, поддержка, обратная связь и возможность пробовать разные подходы без лишнего давления.',
    en: 'An environment that combines clarity, support, feedback, and room to try different approaches without excessive pressure may feel comfortable.',
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
  if (dominantTraits.includes('adaptability') && !directions.some((item) => item.key === 'results.directions.productExperiments')) {
    directions.push({ key: 'results.directions.productExperiments', ru: 'Проектные эксперименты и динамичные команды', en: 'Project experiments and dynamic teams' })
  }

  return directions.slice(0, 3)
}

function buildReasoning(input: {
  dominantTraits: TraitKey[]
  primary: RankedProfessionResult
  alternatives: RankedProfessionResult[]
  profileClarity: number
}) {
  const topTraitsRu = listTraitsRu(input.dominantTraits.slice(0, 4))
  const topTraitsEn = listTraitsEn(input.dominantTraits.slice(0, 4))
  const primarySharedRu = listTraitsRu(input.primary.sharedTraits)
  const primarySharedEn = listTraitsEn(input.primary.sharedTraits)
  const alternativesRu = input.alternatives.map((item) => item.profession.titleRu).join(', ')
  const alternativesEn = input.alternatives.map((item) => item.profession.titleEn).join(', ')
  const confidenceRu =
    input.profileClarity >= 0.72
      ? 'Профиль ответов достаточно сфокусирован, поэтому основной результат можно читать как сильную гипотезу для проверки.'
      : 'Профиль ответов широкий: результат показывает несколько близких гипотез, поэтому особенно полезно сравнить альтернативы через маленькие пробы.'
  const confidenceEn =
    input.profileClarity >= 0.72
      ? 'The answer profile is fairly focused, so the primary result can be read as a strong hypothesis to test.'
      : 'The answer profile is broad: the result shows several close hypotheses, so comparing alternatives through small trials will be especially useful.'

  return {
    reasoningRu: [
      `Профиль ответов сильнее всего показывает: ${topTraitsRu}. Эти признаки сравнивались с профилями профессий из каталога W.A.Y.`,
      `Основное совпадение - ${input.primary.profession.titleRu}: у него пересекаются ключевые требования с вашими ответами (${primarySharedRu}).`,
      `${confidenceRu} Альтернативы (${alternativesRu}) близки по расчету, но предлагают другие рабочие среды и первые шаги.`,
    ],
    reasoningEn: [
      `The answer profile is strongest in ${topTraitsEn}. These signals were compared with W.A.Y. profession profiles.`,
      `The primary match is ${input.primary.profession.titleEn}: its core requirements overlap with your answers (${primarySharedEn}).`,
      `${confidenceEn} The alternatives (${alternativesEn}) are close by calculation but point to different work environments and first steps.`,
    ],
  }
}

export function buildFinalResult(input: {
  userTraits: TraitVector
  tagScores: Record<string, number>
  dominantTraits: TraitKey[]
  profileClarity: number
  ranked: RankedProfessionResult[]
}): CareerTestDeterministicResult {
  const normalized = normalizeMatchPercents(input.ranked, input.profileClarity)
  const selected = normalized.slice(0, 4)
  const primary = selected[0]
  const alternatives = selected.slice(1, 4)
  const dominantLabels = input.dominantTraits.slice(0, 4).map((key) => traitLabels[key])
  const recommendations = selected.map((item) => ({ ...item, ...buildRecommendationReason(item) }))
  const topTraitRu = listTraitsRu(input.dominantTraits.slice(0, 3))
  const topTraitEn = listTraitsEn(input.dominantTraits.slice(0, 3))
  const reasoning = buildReasoning({
    dominantTraits: input.dominantTraits,
    primary,
    alternatives,
    profileClarity: input.profileClarity,
  })
  const clarityRu =
    input.profileClarity >= 0.72
      ? 'Ответы дали достаточно сфокусированный профиль.'
      : 'Ответы дали широкий профиль, поэтому несколько направлений могут быть близки.'
  const clarityEn =
    input.profileClarity >= 0.72
      ? 'Your answers produced a fairly focused profile.'
      : 'Your answers produced a broad profile, so several directions may be close.'

  return {
    userTraits: input.userTraits,
    tagScores: input.tagScores,
    dominantTraits: input.dominantTraits,
    profileClarity: input.profileClarity,
    primary,
    alternatives,
    recommendations,
    profileTitleKey: 'results.profileTitle',
    summaryRu: `Лучшее расчетное совпадение - ${primary.profession.titleRu} (${primary.matchPercent}%). Алгоритм опирается на ответы, где сильнее всего проявились: ${topTraitRu}. ${clarityRu} Это ориентир для проверки направления, а не окончательный диагноз.`,
    summaryEn: `The strongest calculated match is ${primary.profession.titleEn} (${primary.matchPercent}%). The algorithm is based on answers where these signals were strongest: ${topTraitEn}. ${clarityEn} Treat it as a direction to test, not a final verdict.`,
    reasoningRu: reasoning.reasoningRu,
    reasoningEn: reasoning.reasoningEn,
    strengths: dominantLabels,
    workStyle: chooseWorkStyle(input.dominantTraits, input.userTraits),
    preferredEnvironment: chooseEnvironment(input.dominantTraits, input.userTraits),
    recommendedDirections: chooseDirections(input.dominantTraits),
    roadmap,
  }
}
