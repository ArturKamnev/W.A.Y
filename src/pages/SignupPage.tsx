import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge, Button, Card, Field, Input, Select, Section } from '../components/ui'
import { repositories } from '../services/repositories'
import { useAuthStore, usePreferencesStore } from '../store/useStores'
import { signUpSchema, type SignUpFormValues } from '../utils/validation'

export function SignupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const language = usePreferencesStore((state) => state.language)
  const setSession = useAuthStore((state) => state.setSession)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      grade: '',
      preferredLanguage: language,
    },
  })

  const onSubmit = async (values: SignUpFormValues) => {
    setServerError(null)
    try {
      const session = await repositories.auth.signUp(values)
      setSession(session)
      navigate('/profile')
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t('auth.validation.email'))
    }
  }

  return (
    <Section title={t('auth.signupTitle')} lead={t('auth.signupLead')}>
      <Card className="profile-panel auth-card">
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <Field label={t('auth.name')} error={errors.name ? t(errors.name.message ?? '') : undefined}>
            <Input autoComplete="name" {...register('name')} />
          </Field>
          <Field label={t('auth.email')} error={errors.email ? t(errors.email.message ?? '') : undefined}>
            <Input autoComplete="email" type="email" {...register('email')} />
          </Field>
          <Field label={t('auth.password')} error={errors.password ? t(errors.password.message ?? '') : undefined}>
            <Input autoComplete="new-password" type="password" {...register('password')} />
          </Field>
          <Field label={t('auth.grade')} error={errors.grade ? t(errors.grade.message ?? '') : undefined}>
            <Input {...register('grade')} />
          </Field>
          <Field label={t('auth.preferredLanguage')}>
            <Select {...register('preferredLanguage')}>
              <option value="en">{t('auth.languageEnglish')}</option>
              <option value="ru">{t('auth.languageRussian')}</option>
            </Select>
          </Field>
          <Button type="submit" full disabled={isSubmitting}>
            {t('auth.create')}
          </Button>
          {serverError ? <Badge>{serverError}</Badge> : null}
          <p>{t('auth.mockNotice')}</p>
          <Link to="/login">{t('auth.toLogin')}</Link>
        </form>
      </Card>
    </Section>
  )
}
