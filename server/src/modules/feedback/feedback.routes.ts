import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../db/prisma.js'
import { optionalAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'

export const feedbackRouter = Router()

const feedbackSchema = z.object({
  message: z.string().trim().min(10).max(1200),
  name: z.string().trim().min(2).max(80).optional().or(z.literal('')),
  email: z.string().trim().email().max(120).optional().or(z.literal('')),
  page: z.string().trim().max(240).optional().or(z.literal('')),
})

const emptyToUndefined = (value: string | undefined) => (value?.trim() ? value.trim() : undefined)

feedbackRouter.post(
  '/',
  optionalAuth,
  asyncHandler(async (request, response) => {
    const body = feedbackSchema.parse(request.body)
    const feedback = await prisma.feedback.create({
      data: {
        userId: request.user?.id,
        name: emptyToUndefined(body.name),
        email: emptyToUndefined(body.email),
        message: body.message.trim(),
        page: emptyToUndefined(body.page),
        userAgent: request.get('user-agent')?.slice(0, 500),
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    response.status(201).json({
      id: feedback.id,
      createdAt: feedback.createdAt.toISOString(),
    })
  }),
)
