import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, EmptyState, Field, Input, LoadingState, Select, Section } from '../components/ui'
import { repositories } from '../services/repositories'
import { useAuthStore } from '../store/useStores'
import type { AdminFeedback, AdminStats, AdminUser } from '../types/models'

export function AdminPage() {
  const { t } = useTranslation()
  const session = useAuthStore((state) => state.session)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [feedback, setFeedback] = useState<AdminFeedback[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<'all' | 'user' | 'admin'>('all')
  const [loading, setLoading] = useState(true)

  const canAdmin = session?.user.role === 'admin'

  useEffect(() => {
    if (!canAdmin) return
    let active = true
    Promise.all([
      repositories.admin.getStats(),
      repositories.admin.listUsers({ search, role: role === 'all' ? undefined : role }),
      repositories.admin.listFeedback(),
    ])
      .then(([nextStats, nextUsers, nextFeedback]) => {
        if (!active) return
        setStats(nextStats)
        setUsers(nextUsers)
        setFeedback(nextFeedback)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [canAdmin, role, search])

  const statCards = useMemo(
    () =>
      stats
        ? [
            ['admin.stats.totalUsers', stats.totalUsers],
            ['admin.stats.activeUsers', stats.activeUsers],
            ['admin.stats.completedTests', stats.completedTests],
            ['admin.stats.savedProfessions', stats.savedProfessions],
            ['admin.stats.guideConversations', stats.guideConversations],
            ['admin.stats.recentSignups', stats.recentSignups],
            ['admin.stats.feedbackCount', stats.feedbackCount ?? feedback.length],
          ]
        : [],
    [feedback.length, stats],
  )

  const setUserStatus = async (user: AdminUser) => {
    const updated = await repositories.admin.setUserStatus(user.id, !user.isActive)
    setUsers((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
  }

  const setUserRole = async (user: AdminUser) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin'
    const updated = await repositories.admin.setUserRole(user.id, nextRole)
    setUsers((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
  }

  const deleteFeedback = async (item: AdminFeedback) => {
    await repositories.admin.deleteFeedback(item.id)
    setFeedback((current) => current.filter((feedbackItem) => feedbackItem.id !== item.id))
    setStats((current) =>
      current
        ? {
            ...current,
            feedbackCount: Math.max(0, (current.feedbackCount ?? feedback.length) - 1),
          }
        : current,
    )
  }

  if (!session) {
    return (
      <Section eyebrow={t('admin.eyebrow')} title={t('admin.title')} lead={t('admin.loginRequired')}>
        <Link className="button button--primary" to="/login">
          {t('nav.login')}
        </Link>
      </Section>
    )
  }

  if (!canAdmin) {
    return (
      <Section eyebrow={t('admin.eyebrow')} title={t('admin.forbiddenTitle')} lead={t('admin.forbiddenLead')}>
        <Link className="button button--secondary" to="/profile">
          {t('nav.profile')}
        </Link>
      </Section>
    )
  }

  return (
    <Section eyebrow={t('admin.eyebrow')} title={t('admin.title')} lead={t('admin.lead')}>
      {loading && !stats ? <LoadingState label={t('common.loading')} /> : null}

      {stats ? (
        <div className="grid grid--3 admin-stats">
          {statCards.map(([label, value]) => (
            <Card className="value-card" key={label}>
              <Badge>{t(label as string)}</Badge>
              <strong className="admin-stat-value">{value}</strong>
            </Card>
          ))}
        </div>
      ) : null}

      <Card className="profile-panel admin-panel">
        <div className="filter-row">
          <Field label={t('common.search')}>
            <Input value={search} placeholder={t('admin.searchPlaceholder')} onChange={(event) => setSearch(event.target.value)} />
          </Field>
          <Field label={t('admin.role')}>
            <Select value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
              <option value="all">{t('common.all')}</option>
              <option value="user">{t('admin.roles.user')}</option>
              <option value="admin">{t('admin.roles.admin')}</option>
            </Select>
          </Field>
        </div>

        <div className="admin-table" role="table" aria-label={t('admin.users')}>
          <div className="admin-table__row admin-table__row--head" role="row">
            <span>{t('admin.user')}</span>
            <span>{t('admin.role')}</span>
            <span>{t('admin.status')}</span>
            <span>{t('admin.actions')}</span>
          </div>
          {users.map((user) => (
            <div className="admin-table__row" role="row" key={user.id}>
              <span>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </span>
              <Badge>{t(`admin.roles.${user.role ?? 'user'}`)}</Badge>
              <Badge>{user.isActive ? t('admin.active') : t('admin.inactive')}</Badge>
              <span className="admin-actions">
                <Button type="button" variant="secondary" onClick={() => void setUserStatus(user)}>
                  {user.isActive ? t('admin.deactivate') : t('admin.activate')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => void setUserRole(user)}>
                  {user.role === 'admin' ? t('admin.makeUser') : t('admin.makeAdmin')}
                </Button>
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="profile-panel admin-panel">
        <div className="admin-panel__header">
          <div>
            <Badge>{t('admin.feedback.title')}</Badge>
            <h3>{t('admin.feedback.heading')}</h3>
            <p>{t('admin.feedback.lead')}</p>
          </div>
        </div>

        {feedback.length ? (
          <div className="feedback-admin-list">
            {feedback.map((item) => (
              <article className="feedback-admin-item" key={item.id}>
                <div>
                  <div className="feedback-admin-item__meta">
                    <Badge>{new Date(item.createdAt).toLocaleString()}</Badge>
                    {item.page ? <Badge>{item.page}</Badge> : null}
                  </div>
                  <p>{item.message}</p>
                  <small>
                    {item.user?.email ?? item.email ?? t('admin.feedback.anonymous')}
                    {item.name ? ` · ${item.name}` : ''}
                  </small>
                </div>
                <Button type="button" variant="ghost" onClick={() => void deleteFeedback(item)}>
                  {t('admin.feedback.delete')}
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={t('admin.feedback.emptyTitle')} body={t('admin.feedback.emptyBody')} />
        )}
      </Card>
    </Section>
  )
}
