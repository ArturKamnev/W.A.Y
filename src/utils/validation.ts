import { z } from 'zod'

export const signInSchema = z.object({
  identifier: z.string().min(3, 'auth.validation.identifier'),
  password: z.string().min(6, 'auth.validation.password'),
})

export const signUpSchema = z.object({
  name: z.string().min(2, 'auth.validation.name'),
  email: z.string().email('auth.validation.email'),
  password: z.string().min(8, 'auth.validation.passwordLong'),
  grade: z.string().min(1, 'auth.validation.grade'),
  preferredLanguage: z.enum(['en', 'ru']),
})

export type SignInFormValues = z.infer<typeof signInSchema>
export type SignUpFormValues = z.infer<typeof signUpSchema>
