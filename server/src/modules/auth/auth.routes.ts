import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../../db/prisma.js'
import { requireAuth, signAuthToken } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/httpError.js'
import { publicUser } from '../../utils/response.js'
import { loginSchema, signUpSchema } from './auth.schemas.js'

export const authRouter = Router()

function sessionFor(user: Awaited<ReturnType<typeof prisma.user.create>>) {
  return {
    user: publicUser(user),
    token: signAuthToken(user),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

authRouter.post(
  '/signup',
  asyncHandler(async (request, response) => {
    const data = signUpSchema.parse(request.body)
    const passwordHash = await bcrypt.hash(data.password, 12)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        gradeOrAge: data.grade,
        preferredLanguage: data.preferredLanguage,
      },
    })

    response.status(201).json(sessionFor(user))
  }),
)

authRouter.post(
  '/login',
  asyncHandler(async (request, response) => {
    const data = loginSchema.parse(request.body)
    const user = await prisma.user.findUnique({ where: { email: data.identifier.toLowerCase() } })
    if (!user || !user.isActive) throw new HttpError(401, 'Invalid credentials')

    const ok = await bcrypt.compare(data.password, user.passwordHash)
    if (!ok) throw new HttpError(401, 'Invalid credentials')

    response.json(sessionFor(user))
  }),
)

authRouter.post('/logout', (_request, response) => {
  response.status(204).send()
})

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (request, response) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.user!.id } })
    response.json({ user: publicUser(user) })
  }),
)
