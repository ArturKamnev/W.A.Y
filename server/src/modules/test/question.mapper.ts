import type { TestQuestion, TestQuestionOption } from '@prisma/client'

const optionKeys = ['test.options.low', 'test.options.medium', 'test.options.high', 'test.options.veryHigh']

export function toQuestionDto(question: TestQuestion & { options: TestQuestionOption[] }) {
  return {
    id: question.id,
    category: question.category,
    promptKey: `test.questions.q${question.sortOrder}`,
    textRu: question.textRu,
    textEn: question.textEn,
    options: question.options
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map((option, index) => {
        const scoring = option.scoringPayload as { tags?: string[] }
        return {
          id: option.id,
          labelKey: optionKeys[index] ?? optionKeys[0],
          labelRu: option.labelRu,
          labelEn: option.labelEn,
          value: option.value,
          tags: scoring.tags ?? [],
        }
      }),
  }
}
