import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { asyncHandler } from '../../utils/asyncHandler.js'

export const healthRouter = Router()

healthRouter.get(
  '/',
  asyncHandler(async (_request, response) => {
    await prisma.$queryRaw`SELECT 1`
    response.json({ ok: true, service: 'way-api', timestamp: new Date().toISOString() })
  }),
)
