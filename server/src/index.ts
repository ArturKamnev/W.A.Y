import { env } from './config/env.js'
import { prisma } from './db/prisma.js'
import { createApp } from './app.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`W.A.Y. API listening on http://localhost:${env.PORT}`)
})

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())
