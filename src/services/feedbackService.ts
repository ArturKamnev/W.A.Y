import type { AdminFeedback, FeedbackReceipt, FeedbackSubmission } from '../types/models'

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))

let feedbackItems: AdminFeedback[] = []

export const feedbackService = {
  async createFeedback(submission: FeedbackSubmission): Promise<FeedbackReceipt> {
    await wait()
    const item: AdminFeedback = {
      id: `feedback-${Date.now()}`,
      message: submission.message,
      name: submission.name,
      email: submission.email,
      page: submission.page,
      createdAt: new Date().toISOString(),
      user: null,
    }
    feedbackItems = [item, ...feedbackItems]

    return {
      id: item.id,
      createdAt: item.createdAt,
    }
  },

  async listFeedback(): Promise<AdminFeedback[]> {
    await wait(120)
    return feedbackItems
  },

  async deleteFeedback(id: string): Promise<void> {
    await wait(120)
    feedbackItems = feedbackItems.filter((item) => item.id !== id)
  },
}
