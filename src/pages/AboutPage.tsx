import { useTranslation } from 'react-i18next'
import { Badge, Card, Section } from '../components/ui'
import { mediaAssets } from '../data/media'

const pillars = [
  ['about.missionTitle', 'about.missionBody'],
  ['about.problemTitle', 'about.problemBody'],
  ['about.helpTitle', 'about.helpBody'],
]

const team = [
  { nameKey: 'about.team.maxim.name', roleKey: 'about.team.maxim.role' },
  { nameKey: 'about.team.artur.name', roleKey: 'about.team.artur.role' },
  { nameKey: 'about.team.eldar.name', roleKey: 'about.team.eldar.role' },
  { nameKey: 'about.team.zhanibek.name', roleKey: 'about.team.zhanibek.role' },
  { nameKey: 'about.team.chyngyz.name', roleKey: 'about.team.chyngyz.role' },
  { nameKey: 'about.team.adil.name', roleKey: 'about.team.adil.role' },
]

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <>
      <Section eyebrow={t('about.eyebrow')} title={t('about.title')} lead={t('about.lead')}>
        <div className="grid grid--2" style={{ marginTop: 'var(--space-6)', alignItems: 'stretch' }}>
          <div className="hero-visual card">
            <img alt={t(mediaAssets.about.altKey)} src={mediaAssets.about.url} />
            <div className="hero-visual__overlay" />
          </div>
          <div className="grid">
            {pillars.map(([title, body]) => (
              <Card className="value-card" key={title}>
                <h3>{t(title)}</h3>
                <p>{t(body)}</p>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section title={t('about.teamTitle')} lead={t('about.teamLead')} compact>
        <div className="grid grid--3" style={{ marginTop: 'var(--space-6)' }}>
          {team.map((member, index) => (
            <Card className="team-card" key={member.nameKey}>
              <Badge>{String(index + 1).padStart(2, '0')}</Badge>
              <h3>{t(member.nameKey)}</h3>
              <p>{t(member.roleKey)}</p>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}
