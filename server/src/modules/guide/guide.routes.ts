import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../../db/prisma.js'
import { requireAuth } from '../../middleware/auth.js'
import { groqService } from '../../services/groqService.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { HttpError } from '../../utils/httpError.js'

export const guideRouter = Router()

const guideLimiter = rateLimit({
  windowMs: 60_000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
})

const topics = [
  { id: 'lost', titleKey: 'guide.topics.lost', promptKey: 'guide.suggestions.lost' },
  { id: 'results', titleKey: 'guide.topics.results', promptKey: 'guide.suggestions.results' },
  { id: 'wrong', titleKey: 'guide.topics.wrong', promptKey: 'guide.suggestions.wrong' },
  { id: 'plan', titleKey: 'guide.topics.plan', promptKey: 'guide.suggestions.plan' },
]

function conversationDto(conversation: {
  id: string
  title: string
  updatedAt: Date
  messages?: Array<{ id: string; role: string; content: string; createdAt: Date }>
}) {
  return {
    id: conversation.id,
    titleKey: conversation.title.startsWith('guide.') ? conversation.title : undefined,
    title: conversation.title.startsWith('guide.') ? undefined : conversation.title,
    topicId: 'custom',
    updatedAt: conversation.updatedAt.toISOString(),
    messages: (conversation.messages ?? []).map((message) => ({
      id: message.id,
      role: message.role === 'assistant' ? 'guide' : message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })),
  }
}

guideRouter.use(requireAuth)

guideRouter.get('/topics', (_request, response) => {
  response.json(topics)
})

guideRouter.get(
  '/conversations',
  asyncHandler(async (request, response) => {
    let conversations = await prisma.guideConversation.findMany({
      where: { userId: request.user!.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    })

    if (!conversations.length) {
      const created = await prisma.guideConversation.create({
        data: {
          userId: request.user!.id,
          title: 'guide.conversations.first.title',
          messages: {
            create: {
              role: 'assistant',
              content:
                request.user!.preferredLanguage === 'ru'
                  ? 'Расскажите, что сейчас кажется неясным. Мы превратим это в один спокойный следующий вопрос.'
                  : 'Tell me what feels unclear. We can turn it into one calm next question.',
            },
          },
        },
        include: { messages: true },
      })
      conversations = [created]
    }

    response.json(conversations.map(conversationDto))
  }),
)

guideRouter.post(
  '/conversations',
  asyncHandler(async (request, response) => {
    const body = z.object({ title: z.string().min(1).max(120).optional() }).parse(request.body)
    const conversation = await prisma.guideConversation.create({
      data: {
        userId: request.user!.id,
        title: body.title ?? 'Новый разговор',
      },
      include: { messages: true },
    })
    response.status(201).json(conversationDto(conversation))
  }),
)

guideRouter.get(
  '/conversations/:id/messages',
  asyncHandler(async (request, response) => {
    const id = String(request.params.id)
    const conversation = await prisma.guideConversation.findFirst({
      where: { id, userId: request.user!.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!conversation) throw new HttpError(404, 'Conversation not found')
    response.json(conversationDto(conversation).messages)
  }),
)

guideRouter.post(
  '/conversations/:id/messages',
  guideLimiter,
  asyncHandler(async (request, response) => {
    const body = z.object({ message: z.string().trim().min(1).max(1800) }).parse(request.body)
    const id = String(request.params.id)
    const conversation = await prisma.guideConversation.findFirst({
      where: { id, userId: request.user!.id },
    })
    if (!conversation) throw new HttpError(404, 'Conversation not found')

    const assistantContent = await groqService.guideReply({
      language: request.user!.preferredLanguage,
      userMessage: body.message,
    })

    const [user, assistant] = await prisma.$transaction([
      prisma.guideMessage.create({
        data: { conversationId: conversation.id, role: 'user', content: body.message },
      }),
      prisma.guideMessage.create({
        data: { conversationId: conversation.id, role: 'assistant', content: assistantContent },
      }),
      prisma.guideConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } }),
    ])

    response.status(201).json({
      user: { id: user.id, role: 'user', content: user.content, createdAt: user.createdAt.toISOString() },
      guide: { id: assistant.id, role: 'guide', content: assistant.content, createdAt: assistant.createdAt.toISOString() },
    })
  }),
)
