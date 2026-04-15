import { env } from '../config/env'
import {
  apiAdminService,
  apiAuthService,
  apiGuideService,
  apiProfessionService,
  apiProfileService,
  apiQuestionService,
  apiResultService,
} from './apiRepositories'
import { authService } from './authService'
import { guideService } from './guideService'
import { professionService } from './professionService'
import { profileService } from './profileService'
import { questionService } from './questionService'
import { resultService } from './resultService'

const useMock = env.useMockApi

export const repositories = {
  mode: useMock ? 'mock' : 'api',
  auth: useMock ? authService : apiAuthService,
  guide: useMock ? guideService : apiGuideService,
  professions: useMock ? professionService : apiProfessionService,
  profile: useMock ? profileService : apiProfileService,
  questions: useMock ? questionService : apiQuestionService,
  results: useMock ? resultService : apiResultService,
  admin: apiAdminService,
}
