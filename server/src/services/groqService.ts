import { env } from '../config/env.js'

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
}
