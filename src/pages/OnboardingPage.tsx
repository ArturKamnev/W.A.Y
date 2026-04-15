import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, Section } from '../components/ui'

const cards = [
  ['onboarding.durationTitle', 'onboarding.durationBody'],
  ['onboarding.resultTitle', 'onboarding.resultBody'],
  ['onboarding.noteTitle', 'onboarding.noteBody'],
]

export function OnboardingPage() {
  const { t } = useTranslation()

  return (
    <Section eyebrow={t('onboarding.eyebrow')} title={t('onboarding.title')} lead={t('onboarding.lead')}>
      <div className="grid grid--3" style={{ marginTop: 'var(--space-6)' }}>
        {cards.map(([title, body]) => (
          <Card className="value-card" key={title}>
            <h3>{t(title)}</h3>
            <p>{t(body)}</p>
          </Card>
        ))}
      </div>
      <div className="page-actions" style={{ marginTop: 'var(--space-6)' }}>
        <Link className="button button--primary" to="/test">
          {t('onboarding.start')}
        </Link>
      </div>
    </Section>
  )
}
