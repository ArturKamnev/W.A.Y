import type { ErrorRequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { HttpError } from '../utils/httpError.js'

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  void next
  console.error(
    JSON.stringify({
      level: 'error',
      method: request.method,
      path: request.originalUrl,
      message: error instanceof Error ? error.message : 'Unknown error',
    }),
  )

  if (error instanceof ZodError) {
    response.status(400).json({ message: 'Validation failed', issues: error.issues })
    return
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({ message: error.message, details: error.details })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({ message: 'Resource already exists' })
      return
    }
  }

  response.status(500).json({ message: 'Internal server error' })
}
