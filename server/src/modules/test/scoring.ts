import type { Profession, TestQuestionOption } from '@prisma/client'

interface ScoredAnswer {
  value: number
  tags: string[]
}

interface Recommendation {
  profession: Profession
  matchPercent: number
  reasonRu: string
  reasonEn: string
}

const strengthMap: Record<string, { key: string; ru: string; en: string }> = {
  logic: { key: 'results.strengths.patterns', ru: 'Системное мышление', en: 'Pattern recognition' },
  analysis: { key: 'results.strengths.patterns', ru: 'Аналитика и внимание к закономерностям', en: 'Analytical pattern finding' },
  empathy: { key: 'results.strengths.empathy', ru: 'Эмпатичное общение', en: 'Empathetic communication' },
  creative: { key: 'results.strengths.creativeSystems', ru: 'Креативное системное мышление', en: 'Creative systems thinking' },
  design: { key: 'results.strengths.creativeSystems', ru: 'Визуальное мышление', en: 'Visual thinking' },
}

const directionMap: Record<string, { key: string; ru: string; en: string }> = {
  technology: { key: 'results.directions.digitalProducts', ru: 'Цифровые продукты и интерфейсы', en: 'Digital products and interfaces' },
  design: { key: 'results.directions.digitalProducts', ru: 'Дизайн опыта и продуктов', en: 'Experience and product design' },
  research: { key: 'results.directions.humanResearch', ru: 'Исследования и понимание людей', en: 'Research and human insight' },
  science: { key: 'results.directions.humanResearch', ru: 'Наука и исследовательская работа', en: 'Science and research' },
  teaching: { key: 'results.directions.learningDesign', ru: 'Обучение, наставничество и коммуникация', en: 'Learning, mentoring, and communication' },
  social: { key: 'results.directions.learningDesign', ru: 'Социальное влияние и поддержка', en: 'Social impact and support' },
  business: { key: 'results.directions.digitalProducts', ru: 'Продуктовое и предпринимательское направление', en: 'Product and business building' },
}

export function optionToScoredAnswer(option: TestQuestionOption): ScoredAnswer {
  const payload = option.scoringPayload as { tags?: string[] }
  return { value: option.value, tags: payload.tags ?? [] }
}

export function computeResult(scoredAnswers: ScoredAnswer[], professions: Profession[]) {
  const scores = new Map<string, number>()

  for (const answer of scoredAnswers) {
    for (const tag of answer.tags) {
      scores.set(tag, (scores.get(tag) ?? 0) + answer.value)
    }
  }

  const topTags = [...scores.entries()].sort((first, second) => second[1] - first[1]).map(([tag]) => tag)
  const strengths = topTags
    .map((tag) => strengthMap[tag])
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex((candidate) => candidate.key === item.key) === index)
    .slice(0, 3)

  while (strengths.length < 3) {
    const fallback = Object.values(strengthMap)[strengths.length]
    if (fallback) strengths.push(fallback)
  }

  const recommendedDirections = topTags
    .map((tag) => directionMap[tag])
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex((candidate) => candidate.key === item.key) === index)
    .slice(0, 3)

  const recommendations: Recommendation[] = professions
    .map((profession) => {
      const raw = profession.scoringTags.reduce((total, tag) => total + (scores.get(tag) ?? 0), 0)
      const matchPercent = Math.min(97, Math.max(62, Math.round(68 + raw * 2.1)))
      return {
        profession,
        matchPercent,
        reasonRu: `Совпадение связано с ответами про ${profession.scoringTags.slice(0, 3).join(', ')}.`,
        reasonEn: `This match is connected to your answers around ${profession.scoringTags.slice(0, 3).join(', ')}.`,
      }
    })
    .sort((first, second) => second.matchPercent - first.matchPercent)
    .slice(0, 3)

  return {
    profileTitleKey: 'results.profileTitle',
    summaryRu:
      'Ваши ответы показывают сочетание любопытства, осознанности и стремления найти направление, которое будет ощущаться личным.',
    summaryEn:
      'Your answers show a mix of curiosity, self-awareness, and a wish to find a direction that feels personally meaningful.',
    strengths,
    workStyle: {
      key: 'results.workStyle',
      ru: 'Вам может подходить сфокусированная работа с понятными шагами и возможностью обсуждать идеи с другими.',
      en: 'You may do well with focused work, clear steps, and thoughtful collaboration.',
    },
    preferredEnvironment: {
      key: 'results.environment',
      ru: 'Комфортной может быть среда, где есть современный инструментарий, поддержка и пространство для эксперимента.',
      en: 'You may enjoy environments with modern tools, support, and room for experimentation.',
    },
    recommendedDirections: recommendedDirections.length
      ? recommendedDirections
      : [
          directionMap.technology,
          directionMap.research,
          directionMap.teaching,
        ],
    roadmap: [
      { id: 'roadmap-1', titleKey: 'results.roadmap.step1.title', descriptionKey: 'results.roadmap.step1.description', status: 'next' },
      { id: 'roadmap-2', titleKey: 'results.roadmap.step2.title', descriptionKey: 'results.roadmap.step2.description', status: 'later' },
      { id: 'roadmap-3', titleKey: 'results.roadmap.step3.title', descriptionKey: 'results.roadmap.step3.description', status: 'later' },
    ],
    recommendations,
  }
}
