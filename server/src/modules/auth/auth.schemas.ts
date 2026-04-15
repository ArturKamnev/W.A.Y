import { z } from 'zod'

export const signUpSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  grade: z.string().trim().min(1).max(40).optional(),
  preferredLanguage: z.enum(['ru', 'en']).default('ru'),
})

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  password: z.string().min(6).max(128),
})
