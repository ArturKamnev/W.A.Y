import { mockQuestions } from '../data/mockData'
import type { Question } from '../types/models'

const wait = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms))

export const questionService = {
  async getQuestions(): Promise<Question[]> {
    await wait()
    return mockQuestions
  },
}
