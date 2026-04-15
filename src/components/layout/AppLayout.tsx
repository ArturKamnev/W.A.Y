import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui'
import { LanguageSwitcher } from './LanguageSwitcher'
import { routes } from '../../app/routes'
import { repositories } from '../../services/repositories'
import { useAuthStore, usePreferencesStore } from '../../store/useStores'

export function AppLayout() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
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
