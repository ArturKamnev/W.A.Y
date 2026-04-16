import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, ProgressBar } from '../ui'
import type { CareerRecommendation, ChatMessage, Profession, TestResult } from '../../types/models'

interface CareerCardProps {
  profession: Profession
  matchPercent?: number
  reasonKey?: string
  reasonRu?: string
  reasonEn?: string
  featured?: boolean
  saved?: boolean
  onDetails?: () => void
  onSave?: () => void
}

export function CareerCard({ profession, matchPercent, reasonKey, reasonRu, reasonEn, featured, saved, onDetails, onSave }: CareerCardProps) {
  const { t, i18n } = useTranslation()
  const title = i18n.language === 'ru' && profession.titleRu ? profession.titleRu : profession.titleEn ?? t(profession.titleKey)
  const description =
    i18n.language === 'ru' && profession.descriptionRu ? profession.descriptionRu : profession.descriptionEn ?? t(profession.descriptionKey)
  const reason = i18n.language === 'ru' && reasonRu ? reasonRu : reasonEn

  return (
    <Card className={`profession-card${featured ? ' profession-card--featured' : ''}`}>
      <Badge>{t(profession.fitTagKey)}</Badge>
      <h3>{title}</h3>
      <p>{description}</p>
      {typeof matchPercent === 'number' ? (
        <div className="match">
          <span className="match__value">{matchPercent}%</span>
          <ProgressBar value={matchPercent} label={t('results.recommendationsTitle')} />
          {reason ? <p>{reason}</p> : reasonKey ? <p>{t(reasonKey)}</p> : null}
        </div>
      ) : null}
      <div className="tag-list">
        {profession.skillsKeys.slice(0, 3).map((skill) => (
          <Badge key={skill}>{t(skill)}</Badge>
        ))}
      </div>
      <div className="page-actions">
        {onDetails ? (
          <Button type="button" variant="secondary" onClick={onDetails}>
            {t('common.viewDetails')}
          </Button>
        ) : null}
        {onSave ? (
          <Button type="button" variant={saved ? 'ghost' : 'primary'} onClick={onSave}>
            {saved ? t('common.saved') : t('common.save')}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

export function ResultCard({ title, values }: { title: string; values: string[] }) {
  return (
    <Card className="result-card">
      <h3>{title}</h3>
      <div className="tag-list">
        {values.map((value) => (
          <Badge key={value}>{value}</Badge>
        ))}
      </div>
    </Card>
  )
}

export function RecommendationList({
  result,
  professions,
}: {
  result: TestResult
  professions: Profession[]
}) {
  const recommendations = result.alternativeRecommendations?.length
    ? result.alternativeRecommendations
    : result.recommendations.slice(1, 4)

  return (
    <div className="grid grid--3">
      {recommendations.map((recommendation: CareerRecommendation) => {
        const profession = professions.find((item) => item.id === recommendation.professionId)
        if (!profession) return null

        return (
          <CareerCard
            key={profession.id}
            profession={profession}
            matchPercent={recommendation.matchPercent}
            reasonKey={recommendation.reasonKey}
            reasonRu={recommendation.reasonRu}
            reasonEn={recommendation.reasonEn}
          />
        )
      })}
    </div>
  )
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  const { t } = useTranslation()
  const body = message.contentKey ? t(message.contentKey) : message.content

  return <div className={`chat-bubble chat-bubble--${message.role}`}>{body}</div>
}
