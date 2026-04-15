import { guideTopics, mockConversations } from '../data/mockData'
import type { ChatConversation, ChatMessage, GuideTopic } from '../types/models'

const wait = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms))

const responseKeys = [
  'guide.responses.reflect',
  'guide.responses.results',
  'guide.responses.choice',
  'guide.responses.plan',
]

export const guideService = {
  async listTopics(): Promise<GuideTopic[]> {
    await wait(100)
    return guideTopics
  },

  async listConversations(): Promise<ChatConversation[]> {
    await wait(120)
    return mockConversations
  },

  async createConversation(title?: string): Promise<ChatConversation> {
    await wait(120)
    return {
      id: `conversation-${Date.now()}`,
      titleKey: 'guide.conversations.first.title',
      title,
      topicId: 'custom',
      messages: [],
      updatedAt: new Date().toISOString(),
    }
  },

  async sendMessage(conversationId: string, content: string): Promise<{ user: ChatMessage; guide: ChatMessage }> {
    await wait()
    const now = new Date().toISOString()
    const index = Math.abs(content.length + conversationId.length) % responseKeys.length

    return {
      user: {
        id: `message-user-${Date.now()}`,
        role: 'user',
        content,
        createdAt: now,
      },
      guide: {
        id: `message-guide-${Date.now()}`,
        role: 'guide',
        contentKey: responseKeys[index],
        createdAt: new Date(Date.now() + 1000).toISOString(),
      },
    }
  },
}
