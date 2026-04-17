import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../db/prisma.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/httpError.js'
import { publicUser } from '../../utils/response.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireRole('admin'))

async function audit(adminUserId: string, action: string, targetUserId?: string, metadata?: unknown) {
  await prisma.adminAuditLog.create({
    data: { adminUserId, action, targetUserId, metadata: metadata as object },
  })
}

adminRouter.get(
  '/stats',
  asyncHandler(async (_request, response) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [totalUsers, activeUsers, completedTests, savedProfessions, guideConversations, recentSignups, feedbackCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.testAttempt.count({ where: { status: 'completed' } }),
      prisma.savedProfession.count(),
      prisma.guideConversation.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.feedback.count(),
    ])

    response.json({ totalUsers, activeUsers, completedTests, savedProfessions, guideConversations, recentSignups, feedbackCount })
  }),
)

adminRouter.get(
  '/feedback',
  asyncHandler(async (_request, response) => {
    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    response.json(
      feedback.map((item) => ({
        id: item.id,
        message: item.message,
        name: item.name,
        email: item.email,
        page: item.page,
        userAgent: item.userAgent,
        createdAt: item.createdAt.toISOString(),
        user: item.user,
      })),
    )
  }),
)

adminRouter.delete(
  '/feedback/:id',
  asyncHandler(async (request, response) => {
    const id = String(request.params.id)
    const feedback = await prisma.feedback.findUnique({ where: { id } })
    if (!feedback) throw new HttpError(404, 'Feedback not found')

    await prisma.feedback.delete({ where: { id } })
    await audit(request.user!.id, 'feedback.delete', feedback.userId ?? undefined, { feedbackId: feedback.id })
    response.status(204).send()
  }),
)

adminRouter.get(
  '/users',
  asyncHandler(async (request, response) => {
    const query = z.object({ search: z.string().optional(), role: z.enum(['user', 'admin']).optional() }).parse(request.query)
    const users = await prisma.user.findMany({
      where: {
        ...(query.role ? { role: query.role } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    response.json(users.map(publicUser))
  }),
)

adminRouter.get(
  '/users/:id',
  asyncHandler(async (request, response) => {
    const id = String(request.params.id)
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new HttpError(404, 'User not found')
    const [tests, savedProfessions, conversations] = await Promise.all([
      prisma.testAttempt.count({ where: { userId: user.id, status: 'completed' } }),
      prisma.savedProfession.count({ where: { userId: user.id } }),
      prisma.guideConversation.count({ where: { userId: user.id } }),
    ])
    response.json({ ...publicUser(user), activity: { tests, savedProfessions, conversations } })
  }),
)

adminRouter.patch(
  '/users/:id',
  asyncHandler(async (request, response) => {
    const body = z
      .object({
        name: z.string().min(2).max(80).optional(),
        grade: z.string().max(40).optional(),
        preferredLanguage: z.enum(['ru', 'en']).optional(),
      })
      .parse(request.body)
    const id = String(request.params.id)
    const user = await prisma.user.update({
      where: { id },
      data: { name: body.name, gradeOrAge: body.grade, preferredLanguage: body.preferredLanguage },
    })
    await audit(request.user!.id, 'user.update', user.id, body)
    response.json(publicUser(user))
  }),
)

adminRouter.patch(
  '/users/:id/status',
  asyncHandler(async (request, response) => {
    const body = z.object({ isActive: z.boolean() }).parse(request.body)
    const id = String(request.params.id)
    const user = await prisma.user.update({ where: { id }, data: { isActive: body.isActive } })
    await audit(request.user!.id, 'user.status', user.id, body)
    response.json(publicUser(user))
  }),
)

adminRouter.patch(
  '/users/:id/role',
  asyncHandler(async (request, response) => {
    const body = z.object({ role: z.enum(['user', 'admin']) }).parse(request.body)
    const id = String(request.params.id)
    const user = await prisma.user.update({ where: { id }, data: { role: body.role } })
    await audit(request.user!.id, 'user.role', user.id, body)
    response.json(publicUser(user))
  }),
)
