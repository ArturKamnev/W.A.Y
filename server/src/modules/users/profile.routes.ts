import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../db/prisma.js'
import { requireAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { publicUser } from '../../utils/response.js'

export const profileRouter = Router()

profileRouter.use(requireAuth)

profileRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const [user, saved, results, conversations] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: request.user!.id } }),
      prisma.savedProfession.findMany({
        where: { userId: request.user!.id },
        include: { profession: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.testResult.findMany({
        where: { userId: request.user!.id },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.guideConversation.findMany({
        where: { userId: request.user!.id },
        select: { id: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ])

    response.json({
      ...publicUser(user),
      savedProfessionIds: saved.map((item) => item.profession.slug),
      recentResultIds: results.map((item) => item.id),
      recentConversationIds: conversations.map((item) => item.id),
      roadmap: [
        { id: 'roadmap-1', titleKey: 'results.roadmap.step1.title', descriptionKey: 'results.roadmap.step1.description', status: 'next' },
        { id: 'roadmap-2', titleKey: 'results.roadmap.step2.title', descriptionKey: 'results.roadmap.step2.description', status: 'later' },
      ],
    })
  }),
)

profileRouter.patch(
  '/',
  asyncHandler(async (request, response) => {
    const body = z
      .object({
        name: z.string().min(2).max(80).optional(),
        grade: z.string().max(40).optional(),
        preferredLanguage: z.enum(['ru', 'en']).optional(),
      })
      .parse(request.body)

    const user = await prisma.user.update({
      where: { id: request.user!.id },
      data: {
        name: body.name,
        gradeOrAge: body.grade,
        preferredLanguage: body.preferredLanguage,
      },
    })
    response.json(publicUser(user))
  }),
)
