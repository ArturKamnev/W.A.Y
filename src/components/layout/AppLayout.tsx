import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Field, Input, Modal, Textarea } from '../ui'
import { LanguageSwitcher } from './LanguageSwitcher'
import { routes } from '../../app/routes'
import { repositories } from '../../services/repositories'
import { useAuthStore, usePreferencesStore } from '../../store/useStores'

export function AppLayout() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackName, setFeedbackName] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const language = usePreferencesStore((state) => state.language)
  const session = useAuthStore((state) => state.session)
  const setSession = useAuthStore((state) => state.setSession)

  useEffect(() => {
    void i18n.changeLanguage(language)
  }, [i18n, language])

  const navRoutes = routes.filter((route) => route.showInNav)

  const handleSignOut = async () => {
    await repositories.auth.signOut()
    setSession(null)
    setOpen(false)
  }

  const closeFeedback = () => {
    if (feedbackStatus === 'submitting') return
    setFeedbackOpen(false)
    setFeedbackStatus('idle')
  }

  const openFeedback = () => {
    setOpen(false)
    setFeedbackOpen(true)
    setFeedbackStatus('idle')
  }

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (feedbackMessage.trim().length < 10) {
      setFeedbackStatus('error')
      return
    }

    setFeedbackStatus('submitting')
    try {
      await repositories.feedback.createFeedback({
        message: feedbackMessage.trim(),
        name: feedbackName.trim() || undefined,
        email: feedbackEmail.trim() || session?.user.email,
        page: location.pathname,
      })
      setFeedbackMessage('')
      setFeedbackName('')
      setFeedbackEmail('')
      setFeedbackStatus('success')
    } catch {
      setFeedbackStatus('error')
    }
  }

  return (
    <div className="app-shell">
      <div className="product-frame">
        <header className="navbar">
          <div className="navbar__inner">
            <Link className="brand" to="/">
              <img className="brand__logo" src="/way-logo.png" alt={t('brand.name')} />
              <span className="brand__text">{t('brand.meaning')}</span>
            </Link>

            <div className="navbar__drawer" data-open={open}>
              <nav className="navbar__links">
                {navRoutes.map((route) => (
                  <NavLink key={route.path} to={route.path} onClick={() => setOpen(false)}>
                    {t(route.labelKey)}
                  </NavLink>
                ))}
              </nav>

              <div className="navbar__actions">
                <Button type="button" variant="ghost" onClick={openFeedback}>
                  {t('nav.feedback')}
                </Button>
                <LanguageSwitcher />
                {session?.user.role === 'admin' ? (
                  <Link className="button button--secondary" to="/admin" onClick={() => setOpen(false)}>
                    {t('nav.admin')}
                  </Link>
                ) : null}
                {session ? (
                  <button className="button button--ghost" type="button" onClick={handleSignOut}>
                    {t('nav.logout')}
                  </button>
                ) : (
                  <>
                    <Link className="button button--ghost" to="/login" onClick={() => setOpen(false)}>
                      {t('nav.login')}
                    </Link>
                    <Link className="button button--secondary" to="/signup" onClick={() => setOpen(false)}>
                      {t('nav.signup')}
                    </Link>
                  </>
                )}
                <Link className="button button--primary" to="/onboarding" onClick={() => setOpen(false)}>
                  {t('nav.start')}
                </Link>
              </div>
            </div>

            <Button
              className="nav-toggle"
              type="button"
              variant="secondary"
              aria-expanded={open}
              aria-label={t('nav.menu')}
              onClick={() => setOpen((value) => !value)}
            >
              <span className="nav-toggle__icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </Button>
          </div>
        </header>

        <main className="page-main">
          <Outlet />
        </main>

        <Footer />
      </div>

      <Modal title={t('feedback.title')} open={feedbackOpen} onClose={closeFeedback}>
        <form className="form feedback-form" onSubmit={(event) => void submitFeedback(event)}>
          <p className="modal__lead">{t('feedback.lead')}</p>
          <Field label={t('feedback.message')}>
            <Textarea
              minLength={10}
              maxLength={1200}
              required
              value={feedbackMessage}
              placeholder={t('feedback.placeholder')}
              onChange={(event) => {
                setFeedbackMessage(event.target.value)
                if (feedbackStatus === 'error') setFeedbackStatus('idle')
              }}
            />
          </Field>
          <div className="grid grid--2 feedback-form__meta">
            <Field label={t('feedback.name')}>
              <Input value={feedbackName} maxLength={80} onChange={(event) => setFeedbackName(event.target.value)} />
            </Field>
            <Field label={t('feedback.email')}>
              <Input
                type="email"
                value={feedbackEmail}
                placeholder={session?.user.email ?? 'name@example.com'}
                maxLength={120}
                onChange={(event) => setFeedbackEmail(event.target.value)}
              />
            </Field>
          </div>
          {feedbackStatus === 'success' ? <p className="feedback-form__success">{t('feedback.success')}</p> : null}
          {feedbackStatus === 'error' ? <p className="field__error">{t('feedback.error')}</p> : null}
          <div className="page-actions">
            <Button type="submit" disabled={feedbackStatus === 'submitting'}>
              {feedbackStatus === 'submitting' ? t('feedback.sending') : t('feedback.submit')}
            </Button>
            <Button type="button" variant="ghost" onClick={closeFeedback}>
              {t('common.close')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function Footer() {
  const { t } = useTranslation()
  const footerLinks = routes.filter((route) => route.showInFooter)

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Link className="brand" to="/">
            <img className="brand__logo" src="/way-logo.png" alt={t('brand.name')} />
            <span className="brand__text">{t('brand.meaning')}</span>
          </Link>
          <p>{t('brand.short')}</p>
          <p>{t('footer.madeBy')}</p>
        </div>
        <div className="footer__column">
          <h3>W.A.Y.</h3>
          {footerLinks.map((route) => (
            <Link key={route.path} to={route.path}>
              {t(route.labelKey)}
            </Link>
          ))}
        </div>
        <div className="footer__column">
          <h3>{t('footer.instagram')}</h3>
          <a href="https://www.instagram.com/12school.gymnasium/" rel="noreferrer" target="_blank">
            Страница инстаграм
          </a>
          <span>{t('footer.copyright')}</span>
        </div>
      </div>
    </footer>
  )
}
