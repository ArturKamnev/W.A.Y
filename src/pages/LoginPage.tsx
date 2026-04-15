import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge, Button, Card, Field, Input, Section } from '../components/ui'
import { repositories } from '../services/repositories'
import { useAuthStore } from '../store/useStores'
import { signInSchema, type SignInFormValues } from '../utils/validation'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = async (values: SignInFormValues) => {
    setServerError(null)
    try {
      const session = await repositories.auth.signIn(values)
      setSession(session)
      navigate('/profile')
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t('auth.validation.identifier'))
    }
  }

  return (
    <Section title={t('auth.loginTitle')} lead={t('auth.loginLead')}>
      <Card className="profile-panel auth-card">
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <Field label={t('auth.identifier')} error={errors.identifier ? t(errors.identifier.message ?? '') : undefined}>
            <Input autoComplete="username" {...register('identifier')} />
          </Field>
          <Field label={t('auth.password')} error={errors.password ? t(errors.password.message ?? '') : undefined}>
            <Input autoComplete="current-password" type="password" {...register('password')} />
          </Field>
          <Link to="/login">{t('auth.forgot')}</Link>
          <Button type="submit" full disabled={isSubmitting}>
            {t('auth.signin')}
          </Button>
          {serverError ? <Badge>{serverError}</Badge> : null}
          <p>{t('auth.mockNotice')}</p>
          <Link to="/signup">{t('auth.toSignup')}</Link>
        </form>
      </Card>
    </Section>
  )
}
