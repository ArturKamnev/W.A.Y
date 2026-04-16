import { env } from '../config/env.js'
import { z } from 'zod'
import type { AIExplanationResponse, CareerTestDeterministicResult } from '../modules/test/types.js'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function chat(messages: ChatMessage[], fallback: string) {
  if (!env.GROQ_API_KEY || env.GROQ_API_KEY === 'change_me') return fallback

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch(`${env.GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        temperature: 0.45,
        max_tokens: 420,
        messages,
      }),
      signal: controller.signal,
    })

    if (!response.ok) return fallback
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    return payload.choices?.[0]?.message?.content?.trim() || fallback
  } catch {
    return fallback
  } finally {
    clearTimeout(timeout)
  }
}

const explanationSchema = z.object({
  primaryProfessionSlug: z.string().min(1),
  primaryMatchPercent: z.number().int().min(0).max(100),
  alternatives: z.array(z.object({ slug: z.string().min(1), matchPercent: z.number().int().min(0).max(100) })).length(3),
  summary: z.string().min(20).max(420),
  reasoning: z.array(z.string().min(8).max(180)).min(2).max(3),
})

function stripEmoji(value: string) {
  return value.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s+/g, ' ').trim()
}

function stripEmojiFromExplanation(explanation: AIExplanationResponse): AIExplanationResponse {
  return {
    ...explanation,
    summary: stripEmoji(explanation.summary),
    reasoning: explanation.reasoning.map(stripEmoji).filter(Boolean).slice(0, 3),
  }
}

function deterministicExplanation(input: {
  language: 'ru' | 'en'
  structuredResult: CareerTestDeterministicResult
}): AIExplanationResponse {
  const { structuredResult, language } = input
  const primary = structuredResult.primary
  const alternatives = structuredResult.alternatives.map((item) => ({
    slug: item.profession.slug,
    matchPercent: item.matchPercent,
  }))
  const traits = structuredResult.strengths.map((item) => (language === 'ru' ? item.ru : item.en)).join(', ')

  return {
    primaryProfessionSlug: primary.profession.slug,
    primaryMatchPercent: primary.matchPercent,
    alternatives,
    summary:
      language === 'ru'
        ? `Самое сильное совпадение - ${primary.profession.titleRu}. Результат основан на ваших ответах и заметных признаках: ${traits}.`
        : `The strongest match is ${primary.profession.titleEn}. The result is based on your answers and the strongest signals: ${traits}.`,
    reasoning:
      language === 'ru'
        ? [
            `Профессии выбраны из каталога W.A.Y. по совпадению с вашим trait-профилем.`,
            `Проценты рассчитаны до AI-этапа и не изменяются моделью.`,
            `Дополнительные варианты близки к основному профилю, но раскрывают разные рабочие среды.`,
          ]
        : [
            'The professions are selected from the W.A.Y. catalog by matching your trait profile.',
            'Match percentages are calculated before the AI step and are not changed by the model.',
            'The additional options are close to the main profile but represent different work environments.',
          ],
  }
}

function parseJsonObject(content: string) {
  try {
    return JSON.parse(content)
  } catch {
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(content.slice(start, end + 1))
    throw new Error('AI response did not contain JSON')
  }
}

function assertLockedResult(explanation: AIExplanationResponse, structuredResult: CareerTestDeterministicResult) {
  if (explanation.primaryProfessionSlug !== structuredResult.primary.profession.slug) return false
  if (explanation.primaryMatchPercent !== structuredResult.primary.matchPercent) return false

  return structuredResult.alternatives.every((alternative, index) => {
    const aiAlternative = explanation.alternatives[index]
    return aiAlternative?.slug === alternative.profession.slug && aiAlternative.matchPercent === alternative.matchPercent
  })
}

async function chatJson(messages: ChatMessage[], fallback: AIExplanationResponse, structuredResult: CareerTestDeterministicResult) {
  if (!env.GROQ_API_KEY || env.GROQ_API_KEY === 'change_me') return fallback

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    try {
      const response = await fetch(`${env.GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL,
          temperature: 0.18,
          max_tokens: 520,
          response_format: { type: 'json_object' },
          messages,
        }),
        signal: controller.signal,
      })

      if (!response.ok) continue
      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const content = payload.choices?.[0]?.message?.content?.trim()
      if (!content) continue

      const parsed = explanationSchema.parse(parseJsonObject(content))
      const sanitized = stripEmojiFromExplanation(parsed)
      if (!assertLockedResult(sanitized, structuredResult)) continue
      if (sanitized.reasoning.length >= 2) return sanitized
    } catch {
      continue
    } finally {
      clearTimeout(timeout)
    }
  }

  return fallback
}

export const groqService = {
  async guideReply(input: { language: string; profileContext?: string; userMessage: string }) {
    const fallback =
      input.language === 'ru'
        ? 'Давайте разложим это спокойно: выберите один вопрос, который сейчас кажется самым важным, и один маленький шаг для проверки направления.'
        : 'Let us slow it down: choose one question that matters most right now, then one small step to test the direction.'

    return chat(
      [
        {
          role: 'system',
          content:
            'You are W.A.Y. Guide, a calm career reflection assistant for school students. Do not present yourself as therapy or medical help. Be supportive, practical, concise, and encourage trusted adults or professionals for serious wellbeing concerns.',
        },
        {
          role: 'user',
          content: `Language: ${input.language}. Profile context: ${input.profileContext ?? 'not available'}. Student message: ${input.userMessage}`,
        },
      ],
      fallback,
    )
  },

  async resultExplanation(input: { language: 'ru' | 'en'; structuredResult: unknown }) {
    const fallback =
      input.language === 'ru'
        ? 'Ваши рекомендации построены на повторяющихся интересах, сильных сторонах и предпочитаемом стиле работы. Используйте их как карту для первых экспериментов, а не как окончательный выбор.'
        : 'Your recommendations are based on repeated interests, strengths, and preferred working style. Use them as a map for first experiments, not as a final decision.'

    return chat(
      [
        {
          role: 'system',
          content:
            'Explain deterministic career-test results in a warm, grounded product voice. Keep it practical and non-deterministic. Mention that results are guidance, not a life sentence.',
        },
        { role: 'user', content: `Language: ${input.language}. Result JSON: ${JSON.stringify(input.structuredResult)}` },
      ],
      fallback,
    )
  },

  async resultInterpretation(input: {
    language: 'ru' | 'en'
    structuredResult: CareerTestDeterministicResult
  }): Promise<AIExplanationResponse> {
    const fallback = deterministicExplanation(input)
    const lockedPayload = {
      primaryProfessionSlug: input.structuredResult.primary.profession.slug,
      primaryMatchPercent: input.structuredResult.primary.matchPercent,
      alternatives: input.structuredResult.alternatives.map((item) => ({
        slug: item.profession.slug,
        matchPercent: item.matchPercent,
      })),
      dominantTraits: input.structuredResult.strengths,
      workStyle: input.structuredResult.workStyle,
      preferredEnvironment: input.structuredResult.preferredEnvironment,
      recommendations: input.structuredResult.recommendations.map((item) => ({
        slug: item.profession.slug,
        titleRu: item.profession.titleRu,
        titleEn: item.profession.titleEn,
        matchPercent: item.matchPercent,
        sharedTraits: item.sharedTraits,
      })),
    }

    return chatJson(
      [
        {
          role: 'system',
          content:
            'You write concise career-test result interpretation for W.A.Y. Return valid JSON only. No markdown. No emojis. Do not invent professions. Do not change slugs or percentages. Keep tone clean, modern, professional, and grounded.',
        },
        {
          role: 'user',
          content: `Language: ${input.language}. Locked result data: ${JSON.stringify(lockedPayload)}. Return exactly this JSON shape: {"primaryProfessionSlug":"string","primaryMatchPercent":number,"alternatives":[{"slug":"string","matchPercent":number},{"slug":"string","matchPercent":number},{"slug":"string","matchPercent":number}],"summary":"short clean explanation","reasoning":["reason 1","reason 2","reason 3"]}`,
        },
      ],
      fallback,
      input.structuredResult,
    )
  },
}
