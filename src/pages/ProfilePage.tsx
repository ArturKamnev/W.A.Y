import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CareerCard } from '../components/domain/Cards'
import { Badge, Card, LoadingState, Section } from '../components/ui'
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher'
import { repositories } from '../services/repositories'
import { useAuthStore, useGuideStore, useSavedItemsStore } from '../store/useStores'
import type { Profession, TestResult, UserProfile } from '../types/models'

export function ProfilePage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [professions, setProfessions] = useState<Profession[]>([])
  const [latestResult, setLatestResult] = useState<TestResult | null>(null)
  const [error, setError] = useState('')
  const session = useAuthStore((state) => state.session)
  const savedIds = useSavedItemsStore((state) => state.savedProfessionIds)
  const storedResult = useSavedItemsStore((state) => state.latestResult)
  const conversations = useGuideStore((state) => state.conversations)

  useEffect(() => {
    if (!session && repositories.mode === 'api') return
    let active = true
    Promise.all([
      repositories.profile.getProfile(),
      repositories.professions.listProfessions(),
      repositories.results.getLatestResult().catch(() => storedResult),
      repositories.guide.listConversations().catch(() => conversations),
    ])
      .then(([profileData, professionData, resultData]) => {
        if (!active) return
        setError('')
        setProfile(profileData)
        setProfessions(professionData)
        setLatestResult(storedResult ?? resultData)
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : t('common.empty'))
      })
    return () => {
      active = false
    }
  }, [conversations, session, storedResult, t])

  const savedProfessions = useMemo(() => {
    const ids = new Set([...(profile?.savedProfessionIds ?? []), ...savedIds])
    return professions.filter((profession) => ids.has(profession.id))
  }, [profile?.savedProfessionIds, professions, savedIds])

  if (!session && repositories.mode === 'api') {
    return (
      <Section eyebrow={t('profile.eyebrow')} title={t('profile.title')} lead={t('profile.loginRequired')}>
        <Link className="button button--primary" to="/login">
          {t('nav.login')}
        </Link>
      </Section>
    )
  }

  if (error) {
    return <Section eyebrow={t('profile.eyebrow')} title={t('profile.title')} lead={error} />
  }

  if (!profile) {
    return (
      <Section eyebrow={t('profile.eyebrow')} title={t('profile.title')}>
        <LoadingState label={t('common.loading')} />
      </Section>
    )
  }

  return (
    <Section eyebrow={t('profile.eyebrow')} title={t('profile.title')} lead={t('profile.demoNote')}>
      <div className="profile-layout" style={{ marginTop: 'var(--space-6)' }}>
        <aside className="grid">
          <Card className="profile-panel">
            <img alt={t(profile.avatarAltKey)} className="profile-image" src={profile.avatarUrl} />
            <h3>{profile.name}</h3>
            <p>{profile.email}</p>
            <Badge>{profile.grade}</Badge>
          </Card>
          <Card className="profile-panel">
            <h3>{t('profile.settings')}</h3>
            <div className="grid">
              <div>
                <p>{t('profile.language')}</p>
                <LanguageSwitcher />
              </div>
              <div>
                <p>{t('profile.theme')}</p>
                <Badge>{t('profile.themePlaceholder')}</Badge>
              </div>
              <div>
                <p>{t('profile.notifications')}</p>
                <Badge>{t('profile.notificationsPlaceholder')}</Badge>
              </div>
            </div>
          </Card>
        </aside>

        <div className="grid">
          <Card className="profile-panel">
            <h3>{t('profile.recentResults')}</h3>
            {latestResult ? (
              <>
                <Badge>{t(latestResult.profileTitleKey)}</Badge>
                <p>{latestResult.summaryRu ?? t(latestResult.summaryKey)}</p>
              </>
            ) : (
              <p>{t('results.emptyLead')}</p>
            )}
          </Card>

          <div>
            <h2>{t('profile.savedProfessions')}</h2>
            <div className="grid grid--2">
              {savedProfessions.map((profession) => (
                <CareerCard key={profession.id} profession={profession} />
              ))}
            </div>
          </div>

          <div className="grid grid--2">
            <Card className="profile-panel">
              <h3>{t('profile.recentChats')}</h3>
              <div className="tag-list">
                {conversations.map((conversation) => (
                  <Badge key={conversation.id}>{t(conversation.titleKey)}</Badge>
                ))}
              </div>
            </Card>
            <Card className="profile-panel">
              <h3>{t('profile.roadmap')}</h3>
              <div className="grid">
                {profile.roadmap.map((step) => (
                  <p key={step.id}>{t(step.titleKey)}</p>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Section>
  )
}
