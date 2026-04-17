import { env } from '../config/env'
import {
  apiAdminService,
  apiAuthService,
  apiFeedbackService,
  apiGuideService,
  apiProfessionService,
  apiProfileService,
  apiQuestionService,
  apiResultService,
} from './apiRepositories'
import { authService } from './authService'
import { feedbackService } from './feedbackService'
import { guideService } from './guideService'
import { professionService } from './professionService'
import { profileService } from './profileService'
import { questionService } from './questionService'
import { resultService } from './resultService'

const useMock = env.useMockApi

export const repositories = {
  mode: useMock ? 'mock' : 'api',
  auth: useMock ? authService : apiAuthService,
  feedback: useMock ? feedbackService : apiFeedbackService,
  guide: useMock ? guideService : apiGuideService,
  professions: useMock ? professionService : apiProfessionService,
  profile: useMock ? profileService : apiProfileService,
  questions: useMock ? questionService : apiQuestionService,
  results: useMock ? resultService : apiResultService,
  admin: useMock
    ? {
        ...apiAdminService,
        listFeedback: feedbackService.listFeedback,
        deleteFeedback: feedbackService.deleteFeedback,
      }
    : apiAdminService,
}
