import { defaultResult, mockProfessions, mockRoadmap } from '../data/mockData'
import type { CareerRecommendation, TestResult, TestSubmission } from '../types/models'

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))
let latestResult: TestResult = defaultResult

const professionTags: Record<string, string[]> = {
  'ux-designer': ['design', 'creative', 'research', 'visual', 'empathy'],
  'frontend-developer': ['technology', 'logic', 'building', 'digital', 'deepFocus'],
  'data-analyst': ['analysis', 'logic', 'statistics', 'patterns', 'business'],
  'research-scientist': ['research', 'science', 'experiments', 'precision', 'discovery'],
  'product-manager': ['business', 'leadership', 'strategy', 'communication', 'planning'],
  'psychologist-educator': ['empathy', 'listening', 'people', 'social', 'impact'],
  'teacher-mentor': ['teaching', 'communication', 'social', 'storytelling', 'empathy'],
  'medical-specialist': ['science', 'precision', 'empathy', 'lab', 'focus'],
  entrepreneur: ['business', 'leadership', 'growth', 'market', 'fastPaced'],
}

function scoreRecommendations(submission: TestSubmission): CareerRecommendation[] {
  const scores = new Map<string, number>()

  for (const answer of submission.answers) {
    for (const tag of answer.tags) {
      scores.set(tag, (scores.get(tag) ?? 0) + answer.value)
    }
  }

  return mockProfessions
    .map((profession) => {
      const raw = (professionTags[profession.id] ?? []).reduce((total, tag) => total + (scores.get(tag) ?? 0), 0)
      const matchPercent = Math.min(96, Math.max(58, Math.round(62 + raw * 2.4)))

      return {
        professionId: profession.id,
        matchPercent,
        reasonKey: `results.reasons.${profession.id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}`,
      }
    })
    .sort((first, second) => second.matchPercent - first.matchPercent)
    .slice(0, 4)
}

export const resultService = {
  async submitTest(submission: TestSubmission): Promise<TestResult> {
    await wait()
    const recommendations = scoreRecommendations(submission)

    latestResult = {
      id: `result-${Date.now()}`,
      profileTitleKey: 'results.profileTitle',
      summaryKey: 'results.summary',
      strengthsKeys: ['results.strengths.patterns', 'results.strengths.empathy', 'results.strengths.creativeSystems'],
      workStyleKey: 'results.workStyle',
      environmentKey: 'results.environment',
      directionKeys: ['results.directions.digitalProducts', 'results.directions.humanResearch', 'results.directions.learningDesign'],
      reasoningRu: [
        'Рекомендации рассчитаны по совпадению ответов с профилями профессий.',
        'Проценты отражают относительную близость к каталогу W.A.Y.',
        'Дополнительные профессии близки к основному результату, но раскрывают разные варианты среды.',
      ],
      reasoningEn: [
        'Recommendations are calculated by matching answers to profession profiles.',
        'Percentages reflect relative closeness to the W.A.Y. catalog.',
        'Additional professions are close to the primary result but point to different work environments.',
      ],
      primaryRecommendation: recommendations[0],
      alternativeRecommendations: recommendations.slice(1, 4),
      recommendations,
      roadmap: mockRoadmap,
      createdAt: submission.completedAt,
    }
    return latestResult
  },

  async getLatestResult(): Promise<TestResult> {
    await wait()
    return latestResult
  },
}

export const __resultTesting = {
  scoreRecommendations,
}
