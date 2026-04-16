import { describe, expect, it } from 'vitest'
import { routes } from '../app/routes'
import { resources } from '../i18n'
import { professionService } from '../services/professionService'
import { questionService } from '../services/questionService'
import { __resultTesting } from '../services/resultService'
import { usePreferencesStore, useTestStore } from '../store/useStores'
import { signInSchema, signUpSchema } from '../utils/validation'
import type { TestSubmission } from '../types/models'

describe('W.A.Y. frontend foundation', () => {
  it('defines the required route surface', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '/',
      '/about',
      '/onboarding',
      '/test',
      '/results',
      '/professions',
      '/guide',
      '/profile',
      '/login',
      '/signup',
      '/admin',
      '*',
    ])
  })

  it('loads the 35-question career test from the service layer', async () => {
    const questions = await questionService.getQuestions()
    expect(questions).toHaveLength(35)
    expect(new Set(questions.map((question) => question.category)).size).toBeGreaterThan(5)
  })

  it('filters professions by category', async () => {
    const professions = await professionService.listProfessions({ category: 'technology' })
    expect(professions.length).toBeGreaterThan(0)
    expect(professions.every((profession) => profession.category === 'technology')).toBe(true)
  })

  it('computes deterministic top recommendations from a submission', () => {
    const submission: TestSubmission = {
      completedAt: new Date('2026-04-15T08:00:00.000Z').toISOString(),
      answers: [
        { questionId: 'q-2', optionId: 'q-2-d', value: 4, tags: ['design', 'creative'] },
        { questionId: 'q-4', optionId: 'q-4-d', value: 4, tags: ['systems', 'technology'] },
        { questionId: 'q-7', optionId: 'q-7-d', value: 4, tags: ['empathy', 'social'] },
      ],
    }

    const recommendations = __resultTesting.scoreRecommendations(submission)
    expect(recommendations).toHaveLength(4)
    expect(recommendations[0].matchPercent).toBeGreaterThanOrEqual(recommendations[1].matchPercent)
  })

  it('keeps auth schemas on the frontend boundary', () => {
    expect(signInSchema.safeParse({ identifier: 'student', password: 'secret1' }).success).toBe(true)
    expect(signUpSchema.safeParse({ name: 'A', email: 'bad', password: '123', grade: '', preferredLanguage: 'en' }).success).toBe(false)
  })

  it('ships English and Russian resources', () => {
    expect(resources.en.common.nav.home).toBe('Home')
    expect(resources.ru.common.nav.home).toBe('Главная')
  })

  it('starts persisted stores with useful defaults', () => {
    expect(usePreferencesStore.getState().language).toBe('ru')
    expect(useTestStore.getState().currentIndex).toBe(0)
  })
})
