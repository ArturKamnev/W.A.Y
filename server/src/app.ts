import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { env } from './config/env.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { guideRouter } from './modules/guide/guide.routes.js'
import { healthRouter } from './modules/health/health.routes.js'
import { professionRouter } from './modules/professions/profession.routes.js'
import { testRouter } from './modules/test/test.routes.js'
import { profileRouter } from './modules/users/profile.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use((request, response, next) => {
    const startedAt = Date.now()
    response.on('finish', () => {
      console.log(
        JSON.stringify({
          level: 'info',
          method: request.method,
          path: request.originalUrl,
          status: response.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      )
    })
    next()
  })
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/test', testRouter)
  app.use('/api/professions', professionRouter)
  app.use('/api/profile', profileRouter)
  app.use('/api/guide', guideRouter)
  app.use('/api/admin', adminRouter)

  app.use(errorHandler)

  return app
}
