import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../db/prisma.js'
import { requireAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/httpError.js'
import { toProfessionDto } from './profession.mapper.js'

export const professionRouter = Router()

const filtersSchema = z.object({
  category: z.string().optional(),
  query: z.string().optional(),
})

professionRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    const filters = filtersSchema.parse(request.query)
    const query = filters.query?.trim()

    const professions = await prisma.profession.findMany({
      where: {
        ...(filters.category && filters.category !== 'all' ? { category: filters.category } : {}),
        ...(query
          ? {
              OR: [
                { slug: { contains: query, mode: 'insensitive' } },
                { titleRu: { contains: query, mode: 'insensitive' } },
                { titleEn: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { titleEn: 'asc' },
    })

    response.json(professions.map(toProfessionDto))
  }),
)

professionRouter.get(
  '/saved',
  requireAuth,
  asyncHandler(async (request, response) => {
    const saved = await prisma.savedProfession.findMany({
      where: { userId: request.user!.id },
      include: { profession: true },
      orderBy: { createdAt: 'desc' },
    })
    response.json(saved.map((item) => toProfessionDto(item.profession)))
  }),
)

professionRouter.get(
  '/:slug',
  asyncHandler(async (request, response) => {
    const slug = String(request.params.slug)
    const profession = await prisma.profession.findUnique({ where: { slug } })
    if (!profession) throw new HttpError(404, 'Profession not found')
    response.json(toProfessionDto(profession))
  }),
)

professionRouter.post(
  '/save',
  requireAuth,
  asyncHandler(async (request, response) => {
    const body = z.object({ professionId: z.string().min(1) }).parse(request.body)
    const profession = await prisma.profession.findUnique({ where: { slug: body.professionId } })
    if (!profession) throw new HttpError(404, 'Profession not found')

    await prisma.savedProfession.upsert({
      where: { userId_professionId: { userId: request.user!.id, professionId: profession.id } },
      create: { userId: request.user!.id, professionId: profession.id },
      update: {},
    })

    response.status(201).json({ saved: true, professionId: profession.slug })
  }),
)

professionRouter.delete(
  '/save/:professionId',
  requireAuth,
  asyncHandler(async (request, response) => {
    const professionId = String(request.params.professionId)
    const profession = await prisma.profession.findUnique({ where: { slug: professionId } })
    if (!profession) throw new HttpError(404, 'Profession not found')

    await prisma.savedProfession.deleteMany({
      where: { userId: request.user!.id, professionId: profession.id },
    })

    response.status(204).send()
  }),
)
