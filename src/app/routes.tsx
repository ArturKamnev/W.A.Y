import type { ReactNode } from 'react'
import { AboutPage } from '../pages/AboutPage'
import { AdminPage } from '../pages/AdminPage'
import { GuidePage } from '../pages/GuidePage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { ProfessionsPage } from '../pages/ProfessionsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ResultsPage } from '../pages/ResultsPage'
import { SignupPage } from '../pages/SignupPage'
import { TestPage } from '../pages/TestPage'

export interface AppRoute {
  path: string
  labelKey: string
  element: ReactNode
  showInNav?: boolean
  showInFooter?: boolean
}

export const routes: AppRoute[] = [
  { path: '/', labelKey: 'nav.home', element: <HomePage />, showInNav: true, showInFooter: true },
  { path: '/about', labelKey: 'nav.about', element: <AboutPage />, showInNav: true, showInFooter: true },
  { path: '/onboarding', labelKey: 'nav.start', element: <OnboardingPage />, showInFooter: true },
  { path: '/test', labelKey: 'nav.test', element: <TestPage />, showInNav: true },
  { path: '/results', labelKey: 'results.title', element: <ResultsPage /> },
  { path: '/professions', labelKey: 'nav.professions', element: <ProfessionsPage />, showInNav: true, showInFooter: true },
  { path: '/guide', labelKey: 'nav.guide', element: <GuidePage />, showInNav: true, showInFooter: true },
  { path: '/profile', labelKey: 'nav.profile', element: <ProfilePage />, showInNav: true },
  { path: '/login', labelKey: 'nav.login', element: <LoginPage /> },
  { path: '/signup', labelKey: 'nav.signup', element: <SignupPage /> },
  { path: '/admin', labelKey: 'nav.admin', element: <AdminPage /> },
  { path: '*', labelKey: 'notFound.title', element: <NotFoundPage /> },
]
