import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import type { UserRole } from '@prisma/client'
import { env } from '../config/env.js'
import { prisma } from '../db/prisma.js'
import { HttpError } from '../utils/httpError.js'

interface JwtPayload {
  sub: string
}

export function signAuthToken(user: { id: string }) {
  return jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] })
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const header = request.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
    if (!token) throw new HttpError(401, 'Authentication required')

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, email: true, preferredLanguage: true, isActive: true },
    })

    if (!user || !user.isActive) throw new HttpError(401, 'Account is not available')

    request.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      preferredLanguage: user.preferredLanguage,
    }
    next()
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Invalid or expired session'))
  }
}

export function requireRole(role: UserRole) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) return next(new HttpError(401, 'Authentication required'))
    if (request.user.role !== role) return next(new HttpError(403, 'Insufficient permissions'))
    next()
  }
}
