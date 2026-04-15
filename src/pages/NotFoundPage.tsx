import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Section } from '../components/ui'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <Section eyebrow={t('notFound.eyebrow')} title={t('notFound.title')} lead={t('notFound.lead')}>
      <div className="page-actions" style={{ marginTop: 'var(--space-6)' }}>
        <Link className="button button--primary" to="/">
          {t('common.backHome')}
        </Link>
      </div>
    </Section>
  )
}
