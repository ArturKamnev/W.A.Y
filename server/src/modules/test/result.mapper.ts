import type { Profession, ResultRecommendation, TestResult } from '@prisma/client'

const slugToCamel = (slug: string) => slug.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())

export function toResultDto(
  result: TestResult & { recommendations: Array<ResultRecommendation & { profession: Profession }> },
) {
  const strengths = result.strengths as Array<{ key?: string; ru?: string; en?: string }>
  const workStyle = result.workStyle as { key?: string; ru?: string; en?: string }
  const environment = result.preferredEnvironment as { key?: string; ru?: string; en?: string }
  const directionPayload = result.recommendedDirections as
    | Array<{ key?: string; ru?: string; en?: string }>
    | { items?: Array<{ key?: string; ru?: string; en?: string }>; profileClarity?: number; dominantTraits?: string[] }
  const directions = Array.isArray(directionPayload) ? directionPayload : directionPayload.items ?? []
  const profileClarity = Array.isArray(directionPayload) ? undefined : directionPayload.profileClarity
  const dominantTraits = Array.isArray(directionPayload) ? [] : directionPayload.dominantTraits ?? []
  const roadmap = result.roadmap as Array<{ id: string; titleKey: string; descriptionKey: string; status: 'next' | 'later' | 'done' }>
  const aiReasoningRu = Array.isArray(result.aiReasoningRu) ? result.aiReasoningRu.filter((item): item is string => typeof item === 'string') : []
  const aiReasoningEn = Array.isArray(result.aiReasoningEn) ? result.aiReasoningEn.filter((item): item is string => typeof item === 'string') : []
  const recommendations = [...result.recommendations].sort((first, second) => second.matchPercent - first.matchPercent)
  const recommendationDtos = recommendations.map((recommendation) => ({
    professionId: recommendation.profession.slug,
    matchPercent: recommendation.matchPercent,
    reasonKey: `results.reasons.${slugToCamel(recommendation.profession.slug)}`,
    reasonRu: recommendation.reasonRu,
    reasonEn: recommendation.reasonEn,
  }))

  return {
    id: result.id,
    resultMode: result.aiExplanationRu || result.aiExplanationEn ? 'ai' : 'algorithm',
    profileTitleKey: 'results.profileTitle',
    summaryKey: 'results.summary',
    summaryRu: result.aiExplanationRu ?? result.summaryRu,
    summaryEn: result.aiExplanationEn ?? result.summaryEn,
    profileClarity,
    dominantTraits,
    strengthsKeys: strengths.map((item) => item.key ?? 'results.strengths.patterns'),
    strengthsText: strengths,
    workStyleKey: workStyle.key ?? 'results.workStyle',
    workStyleText: workStyle,
    environmentKey: environment.key ?? 'results.environment',
    environmentText: environment,
    directionKeys: directions.map((item) => item.key ?? 'results.directions.digitalProducts'),
    directionsText: directions,
    reasoningRu: aiReasoningRu,
    reasoningEn: aiReasoningEn,
    primaryRecommendation: recommendationDtos[0],
    alternativeRecommendations: recommendationDtos.slice(1, 4),
    recommendations: recommendationDtos,
    roadmap,
    createdAt: result.createdAt.toISOString(),
  }
}
