import { demoUser } from '../data/mockData'
import type { UserProfile } from '../types/models'

const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    await wait()
    return demoUser
  },

  async updateProfile(profile: Partial<Pick<UserProfile, 'name' | 'grade' | 'preferredLanguage'>>): Promise<UserProfile> {
    await wait()
    return { ...demoUser, ...profile }
  },
}
