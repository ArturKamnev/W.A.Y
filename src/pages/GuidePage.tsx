import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChatBubble } from '../components/domain/Cards'
import { Badge, Button, Card, Input, Section, SuggestionChip } from '../components/ui'
import { repositories } from '../services/repositories'
import { useAuthStore, useGuideStore } from '../store/useStores'
import type { GuideTopic } from '../types/models'

export function GuidePage() {
  const { t } = useTranslation()
  const [topics, setTopics] = useState<GuideTopic[]>([])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState('')
  const session = useAuthStore((state) => state.session)
  const { conversations, activeConversationId, setConversations, setActiveConversationId, appendMessages } = useGuideStore()

  useEffect(() => {
    if (!session && repositories.mode === 'api') return
    let active = true
    Promise.all([repositories.guide.listTopics(), repositories.guide.listConversations()])
      .then(([topicItems, conversationItems]) => {
        if (!active) return
        setTopics(topicItems)
        if (repositories.mode === 'api' || !conversations.length) setConversations(conversationItems)
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : t('common.empty'))
      })
    return () => {
      active = false
    }
  }, [conversations.length, session, setConversations, t])

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0],
    [activeConversationId, conversations],
  )

  const send = async (content: string) => {
    if (!content.trim()) return
    if (!session && repositories.mode === 'api') return
    const conversation = activeConversation ?? (await repositories.guide.createConversation())
    if (!activeConversation) setConversations([conversation])
    setDraft('')
    setTyping(true)
    setError('')
    try {
      const messages = await repositories.guide.sendMessage(conversation.id, content.trim())
      appendMessages(conversation.id, [messages.user, messages.guide])
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : t('common.empty'))
    } finally {
      setTyping(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send(draft)
  }

  if (!session && repositories.mode === 'api') {
    return (
      <Section eyebrow={t('guide.eyebrow')} title={t('guide.title')} lead={t('guide.loginRequired')}>
        <Link className="button button--primary" to="/login">
          {t('nav.login')}
        </Link>
      </Section>
    )
  }

  return (
    <Section eyebrow={t('guide.eyebrow')} title={t('guide.title')} lead={t('guide.lead')}>
      <div className="guide-layout" style={{ marginTop: 'var(--space-6)' }}>
        <aside className="grid">
          <Card className="profile-panel">
            <h3>{t('guide.topicsTitle')}</h3>
            <div className="chat-chips">
              {topics.map((topic) => (
                <SuggestionChip key={topic.id} onClick={() => void send(t(topic.promptKey))}>
                  {t(topic.titleKey)}
                </SuggestionChip>
              ))}
            </div>
          </Card>
          <Card className="profile-panel">
            <h3>{t('guide.conversationsTitle')}</h3>
            <div className="grid">
              {conversations.map((conversation) => (
                <Button
                  key={conversation.id}
                  type="button"
                  variant={conversation.id === activeConversation?.id ? 'primary' : 'secondary'}
                  onClick={() => setActiveConversationId(conversation.id)}
                >
                  {conversation.title ?? t(conversation.titleKey)}
                </Button>
              ))}
            </div>
          </Card>
        </aside>

        <Card className="chat-shell">
          <div className="value-card">
            <Badge>{t('guide.suggestionsTitle')}</Badge>
            <div className="chat-chips" style={{ marginTop: 'var(--space-3)' }}>
              {topics.map((topic) => (
                <SuggestionChip key={topic.promptKey} onClick={() => void send(t(topic.promptKey))}>
                  {t(topic.promptKey)}
                </SuggestionChip>
              ))}
            </div>
          </div>

          <div className="chat-list" aria-live="polite">
            {activeConversation?.messages.map((message) => <ChatBubble key={message.id} message={message} />)}
            {typing ? <Badge>{t('guide.typing')}</Badge> : null}
          </div>

          <form className="chat-input" onSubmit={handleSubmit}>
            <Input value={draft} placeholder={t('guide.inputPlaceholder')} onChange={(event) => setDraft(event.target.value)} />
            <Button type="submit" disabled={!draft.trim() || typing}>
              {t('guide.send')}
            </Button>
          </form>
          {error ? <p className="field__error">{error}</p> : null}
        </Card>
      </div>
    </Section>
  )
}
