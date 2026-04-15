import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../db/prisma.js'
import { requireAuth } from '../../middleware/auth.js'
import { groqService } from '../../services/groqService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/httpError.js'
import { toQuestionDto } from './question.mapper.js'
import { toResultDto } from './result.mapper.js'
import { computeResult, optionToScoredAnswer } from './scoring.js'

export const testRouter = Router()

const answerSchema = z.object({
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  optionId: z.string().min(1),
})

const submitSchema = z.object({
  attemptId: z.string().optional(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      optionId: z.string().min(1),
    }),
  ),
  completedAt: z.string().optional(),
})

testRouter.get(
  '/questions',
  asyncHandler(async (_request, response) => {
    const questions = await prisma.testQuestion.findMany({
      include: { options: true },
      orderBy: { sortOrder: 'asc' },
    })
    response.json(questions.map(toQuestionDto))
  }),
)

testRouter.post(
  '/start',
  requireAuth,
  asyncHandler(async (request, response) => {
    const attempt = await prisma.testAttempt.create({
      data: { userId: request.user!.id },
    })
    response.status(201).json({ id: attempt.id, startedAt: attempt.startedAt.toISOString(), status: attempt.status })
  }),
)

testRouter.post(
  '/answer',
  requireAuth,
  asyncHandler(async (request, response) => {
    const data = answerSchema.parse(request.body)
    const attempt = await prisma.testAttempt.findFirst({ where: { id: data.attemptId, userId: request.user!.id } })
    if (!attempt) throw new HttpError(404, 'Attempt not found')

    const option = await prisma.testQuestionOption.findFirst({
      where: { id: data.optionId, questionId: data.questionId },
    })
    if (!option) throw new HttpError(404, 'Question option not found')

    await prisma.testAnswer.upsert({
      where: { attemptId_questionId: { attemptId: data.attemptId, questionId: data.questionId } },
      create: {
        attemptId: data.attemptId,
        questionId: data.questionId,
        selectedOptionId: data.optionId,
        numericValue: option.value,
        payloadSnapshot: option.scoringPayload ?? undefined,
      },
      update: {
        selectedOptionId: data.optionId,
        numericValue: option.value,
        payloadSnapshot: option.scoringPayload ?? undefined,
      },
    })

    response.json({ saved: true })
  }),
)

testRouter.post(
  '/submit',
  requireAuth,
  asyncHandler(async (request, response) => {
    const data = submitSchema.parse(request.body)
    const attempt = data.attemptId
      ? await prisma.testAttempt.findFirst({ where: { id: data.attemptId, userId: request.user!.id } })
      : await prisma.testAttempt.create({ data: { userId: request.user!.id } })
    if (!attempt) throw new HttpError(404, 'Attempt not found')

    const optionIds = data.answers.map((answer) => answer.optionId)
    const options = await prisma.testQuestionOption.findMany({ where: { id: { in: optionIds } } })
    const optionsById = new Map(options.map((option) => [option.id, option]))

    for (const answer of data.answers) {
      const option = optionsById.get(answer.optionId)
      if (!option || option.questionId !== answer.questionId) continue
      await prisma.testAnswer.upsert({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: answer.questionId } },
        create: {
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedOptionId: answer.optionId,
          numericValue: option.value,
          payloadSnapshot: option.scoringPayload ?? undefined,
        },
        update: {
          selectedOptionId: answer.optionId,
          numericValue: option.value,
          payloadSnapshot: option.scoringPayload ?? undefined,
        },
      })
    }

    const savedAnswers = await prisma.testAnswer.findMany({
      where: { attemptId: attempt.id },
      include: { selectedOption: true },
    })
    const professions = await prisma.profession.findMany()
    const deterministic = computeResult(savedAnswers.map((answer) => optionToScoredAnswer(answer.selectedOption)), professions)
    const [aiExplanationRu, aiExplanationEn] = await Promise.all([
      groqService.resultExplanation({ language: 'ru', structuredResult: deterministic }),
      groqService.resultExplanation({ language: 'en', structuredResult: deterministic }),
    ])

    const result = await prisma.$transaction(async (tx) => {
      await tx.testAttempt.update({
        where: { id: attempt.id },
        data: { status: 'completed', completedAt: data.completedAt ? new Date(data.completedAt) : new Date() },
      })

      await tx.testResult.deleteMany({ where: { attemptId: attempt.id } })
      return tx.testResult.create({
        data: {
          attemptId: attempt.id,
          userId: request.user!.id,
          summaryRu: deterministic.summaryRu,
          summaryEn: deterministic.summaryEn,
          strengths: deterministic.strengths,
          workStyle: deterministic.workStyle,
          preferredEnvironment: deterministic.preferredEnvironment,
          recommendedDirections: deterministic.recommendedDirections,
          roadmap: deterministic.roadmap,
          aiExplanationRu,
          aiExplanationEn,
          recommendations: {
            create: deterministic.recommendations.map((recommendation) => ({
              professionId: recommendation.profession.id,
              matchPercent: recommendation.matchPercent,
              reasonRu: recommendation.reasonRu,
              reasonEn: recommendation.reasonEn,
            })),
          },
        },
        include: { recommendations: { include: { profession: true } } },
      })
    })

    response.status(201).json(toResultDto(result))
  }),
)

testRouter.get(
  '/results/latest',
  requireAuth,
  asyncHandler(async (request, response) => {
    const result = await prisma.testResult.findFirst({
      where: { userId: request.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { recommendations: { include: { profession: true } } },
    })
    if (!result) throw new HttpError(404, 'No result found')
    response.json(toResultDto(result))
  }),
)

testRouter.get(
  '/results/:id',
  requireAuth,
  asyncHandler(async (request, response) => {
    const id = String(request.params.id)
    const result = await prisma.testResult.findFirst({
      where: { id, userId: request.user!.id },
      include: { recommendations: { include: { profession: true } } },
    })
    if (!result) throw new HttpError(404, 'Result not found')
    response.json(toResultDto(result))
  }),
)
