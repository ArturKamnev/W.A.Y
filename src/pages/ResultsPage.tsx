import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, ProgressBar, Section } from '../components/ui'
import { CareerCard, RecommendationList, ResultCard } from '../components/domain/Cards'
import { repositories } from '../services/repositories'
import { useSavedItemsStore } from '../store/useStores'
import type { Profession, TestResult } from '../types/models'

export function ResultsPage() {
  const { t, i18n } = useTranslation()
  const storedResult = useSavedItemsStore((state) => state.latestResult)
  const saveResult = useSavedItemsStore((state) => state.saveResult)
  const [result, setResult] = useState<TestResult | null>(storedResult)
  const [professions, setProfessions] = useState<Profession[]>([])

  useEffect(() => {
    let active = true
    Promise.all([
      repositories.results.getLatestResult().catch(() => storedResult),
      repositories.professions.listProfessions(),
    ]).then(([latest, professionItems]) => {
      if (!active) return
      setResult(storedResult ?? latest ?? null)
      setProfessions(professionItems)
    })
    return () => {
      active = false
    }
  }, [storedResult])

  if (!result) {
    return (
      <Section eyebrow={t('results.eyebrow')} title={t('results.title')} lead={t('results.emptyLead')}>
        <Link className="button button--primary" to="/onboarding">
          {t('nav.start')}
        </Link>
      </Section>
    )
  }

  const summary = i18n.language === 'ru' && result.summaryRu ? result.summaryRu : result.summaryEn ?? t(result.summaryKey)
  const workStyle = i18n.language === 'ru' && result.workStyleText?.ru ? result.workStyleText.ru : result.workStyleText?.en ?? t(result.workStyleKey)
  const environment =
    i18n.language === 'ru' && result.environmentText?.ru ? result.environmentText.ru : result.environmentText?.en ?? t(result.environmentKey)
  const strengths = result.strengthsText?.length
    ? result.strengthsText.map((item) => (i18n.language === 'ru' && item.ru ? item.ru : item.en ?? t(item.key ?? 'results.strengths.patterns')))
    : result.strengthsKeys.map((key) => t(key))
  const directions = result.directionsText?.length
    ? result.directionsText.map((item) => (i18n.language === 'ru' && item.ru ? item.ru : item.en ?? t(item.key ?? 'results.directions.digitalProducts')))
    : result.directionKeys.map((key) => t(key))
  const primaryRecommendation = result.primaryRecommendation ?? result.recommendations[0]
  const primaryProfession = primaryRecommendation ? professions.find((item) => item.id === primaryRecommendation.professionId) : undefined
  const reasoning = i18n.language === 'ru' && result.reasoningRu?.length ? result.reasoningRu : result.reasoningEn ?? []
  const runnerUp = result.alternativeRecommendations?.[0] ?? result.recommendations[1]
  const matchGap =
    primaryRecommendation && runnerUp ? Math.max(0, primaryRecommendation.matchPercent - runnerUp.matchPercent) : undefined
  const clarityPercent = Math.round((result.profileClarity ?? 0.72) * 100)
  const confidenceLabel =
    clarityPercent >= 72
      ? t('results.confidence.focused')
      : clarityPercent >= 58
        ? t('results.confidence.moderate')
        : t('results.confidence.broad')

  return (
    <>
      <Section eyebrow={t('results.eyebrow')} title={t('results.title')} lead={summary}>
        <div className="results-hero" style={{ marginTop: 'var(--space-6)' }}>
          <Card className="value-card">
            <div className="result-mode-row">
              <Badge>{t(result.profileTitleKey)}</Badge>
              {result.resultMode === 'ai' ? <Badge>{t('results.aiBetaBadge')}</Badge> : <Badge>{t('results.algorithmBadge')}</Badge>}
            </div>
            <h3>{t('results.summaryTitle')}</h3>
            <p>{summary}</p>
            <div className="page-actions" style={{ marginTop: 'var(--space-5)' }}>
              <Button type="button" onClick={() => saveResult(result)}>
                {t('results.actions.save')}
              </Button>
              <Link className="button button--secondary" to="/guide">
                {t('results.actions.guide')}
              </Link>
              <Link className="button button--ghost" to="/onboarding">
                {t('results.actions.retake')}
              </Link>
            </div>
          </Card>
          <div className="grid">
            <ResultCard title={t('results.strengthsTitle')} values={strengths} />
            <ResultCard title={t('results.directionsTitle')} values={directions} />
          </div>
        </div>
      </Section>

      <Section title={t('results.evidenceTitle')} lead={t('results.evidenceLead')} compact>
        <div className="result-evidence-grid">
          {primaryRecommendation ? (
            <Card className="result-card result-metric-card">
              <Badge>{t('results.metrics.primary')}</Badge>
              <strong>{primaryRecommendation.matchPercent}%</strong>
              <ProgressBar value={primaryRecommendation.matchPercent} label={t('results.metrics.primary')} />
              <p>{t('results.metrics.primaryBody')}</p>
            </Card>
          ) : null}
          <Card className="result-card result-metric-card">
            <Badge>{t('results.metrics.confidence')}</Badge>
            <strong>{clarityPercent}%</strong>
            <ProgressBar value={clarityPercent} label={t('results.metrics.confidence')} />
            <p>{confidenceLabel}</p>
          </Card>
          {typeof matchGap === 'number' ? (
            <Card className="result-card result-metric-card">
              <Badge>{t('results.metrics.gap')}</Badge>
              <strong>{matchGap}%</strong>
              <p>{matchGap >= 7 ? t('results.metrics.gapClear') : t('results.metrics.gapClose')}</p>
            </Card>
          ) : null}
        </div>
      </Section>

      {primaryRecommendation && primaryProfession ? (
        <Section title={t('results.primaryMatchTitle')} compact>
          <div className="primary-match">
            <CareerCard
              profession={primaryProfession}
              matchPercent={primaryRecommendation.matchPercent}
              reasonKey={primaryRecommendation.reasonKey}
              reasonRu={primaryRecommendation.reasonRu}
              reasonEn={primaryRecommendation.reasonEn}
              featured
            />
          </div>
        </Section>
      ) : null}

      <Section title={t('results.alternativesTitle')} compact>
        <RecommendationList result={result} professions={professions} />
      </Section>

      <Section title={t('results.explanationTitle')} lead={t('results.explanationBody')} compact>
        <div className="grid grid--2" style={{ marginTop: 'var(--space-6)' }}>
          <Card className="result-card">
            <h3>{t('results.workStyleTitle')}</h3>
            <p>{workStyle}</p>
          </Card>
          <Card className="result-card">
            <h3>{t('results.environmentTitle')}</h3>
            <p>{environment}</p>
          </Card>
        </div>
        {reasoning.length ? (
          <Card className="result-card result-card--reasoning" style={{ marginTop: 'var(--space-5)' }}>
            <h3>{t('results.whyFitsTitle')}</h3>
            <ul className="reason-list">
              {reasoning.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ) : null}
      </Section>

      <Section title={t('results.nextStepsTitle')} compact>
        <div className="grid grid--3" style={{ marginTop: 'var(--space-6)' }}>
          {result.roadmap.map((step) => (
            <Card className="roadmap-item" key={step.id}>
              <Badge>{t(`results.status.${step.status}`)}</Badge>
              <h3>{t(step.titleKey)}</h3>
              <p>{t(step.descriptionKey)}</p>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}
