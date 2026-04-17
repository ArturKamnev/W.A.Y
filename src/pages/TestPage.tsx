import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, LoadingState, ProgressBar, Section } from '../components/ui'
import { repositories } from '../services/repositories'
import { useAuthStore, useSavedItemsStore, useTestStore } from '../store/useStores'
import type { Question } from '../types/models'

type ResultMode = 'algorithm' | 'ai'

export function TestPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingMode, setSubmittingMode] = useState<ResultMode | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const session = useAuthStore((state) => state.session)
  const { answers, currentIndex, lastSavedAt, setAnswer, setCurrentIndex, resetTest } = useTestStore()
  const setLatestResult = useSavedItemsStore((state) => state.setLatestResult)

  useEffect(() => {
    let active = true
    repositories.questions
      .getQuestions()
      .then((items) => {
        if (!active) return
        setQuestions(items)
      })
      .catch(() => {
        if (!active) return
        setSubmitError(t('test.loadError'))
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [t])

  const currentQuestion = questions[currentIndex]
  const selectedOptionId = currentQuestion ? answers[currentQuestion.id]?.optionId : undefined
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
  const isComplete = questions.length > 0 && answeredCount >= questions.length
  const unansweredCount = Math.max(0, questions.length - answeredCount)

  const goToIndex = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, questions.length - 1)))
  }

  const goToFirstUnanswered = () => {
    const index = questions.findIndex((question) => !answers[question.id])
    if (index >= 0) goToIndex(index)
  }

  const finish = async (resultMode: ResultMode) => {
    if (!session) {
      navigate('/login')
      return
    }

    if (!isComplete) {
      setSubmitError(t('test.completeRequired', { count: unansweredCount }))
      goToFirstUnanswered()
      return
    }

    setSubmittingMode(resultMode)
    setSubmitError(null)
    try {
      const result = await repositories.results.submitTest({
        resultMode,
        answers: Object.values(answers),
        completedAt: new Date().toISOString(),
      })
      setLatestResult(result)
      resetTest()
      navigate('/results')
    } catch {
      setSubmitError(t('test.submitError'))
    } finally {
      setSubmittingMode(null)
    }
  }

  if (loading || !currentQuestion) {
    return (
      <Section eyebrow={t('test.eyebrow')} title={t('test.title')}>
        {loading ? <LoadingState label={t('common.loading')} /> : <p className="field__error">{submitError ?? t('test.loadError')}</p>}
      </Section>
    )
  }

  return (
    <Section eyebrow={t('test.eyebrow')} title={t('test.title')}>
      <div className="test-shell" style={{ marginTop: 'var(--space-6)' }}>
        <Card className="question-card">
          <div className="page-actions" style={{ justifyContent: 'space-between' }}>
            <Badge>{t(`test.categories.${currentQuestion.category}`)}</Badge>
            <Badge>{t('test.counter', { current: currentIndex + 1, total: questions.length })}</Badge>
          </div>
          <ProgressBar value={progress} label={t('test.counter', { current: currentIndex + 1, total: questions.length })} />
          <h2>{t(currentQuestion.promptKey)}</h2>
          <div className="option-grid">
            {currentQuestion.options.map((option) => (
              <button
                aria-pressed={selectedOptionId === option.id}
                className="option"
                key={option.id}
                type="button"
                onClick={() => {
                  setAnswer({
                    questionId: currentQuestion.id,
                    optionId: option.id,
                    value: option.value,
                    tags: option.tags,
                  })
                  setSubmitError(null)
                }}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </Card>

        <div className="test-controls">
          <Button type="button" variant="secondary" disabled={currentIndex === 0} onClick={() => goToIndex(currentIndex - 1)}>
            {t('test.back')}
          </Button>
          <Button type="button" variant="ghost" disabled={currentIndex === questions.length - 1} onClick={() => goToIndex(currentIndex + 1)}>
            {t('test.skip')}
          </Button>
          {currentIndex === questions.length - 1 ? null : (
            <Button type="button" onClick={() => goToIndex(currentIndex + 1)}>
              {t('test.next')}
            </Button>
          )}
          <Badge>{t('test.answered', { answered: answeredCount, total: questions.length })}</Badge>
          {lastSavedAt ? <Badge>{t('test.autosaved')}</Badge> : null}
        </div>

        {currentIndex === questions.length - 1 ? (
          <Card className="test-finish-card">
            <div>
              <Badge>{isComplete ? t('test.readyBadge') : t('test.unansweredBadge', { count: unansweredCount })}</Badge>
              <h3>{t('test.resultChoiceTitle')}</h3>
              <p>{isComplete ? t('test.resultChoiceLead') : t('test.completeRequired', { count: unansweredCount })}</p>
            </div>
            {submitError ? <p className="field__error">{submitError}</p> : null}
            <div className="test-result-actions">
              <Button type="button" disabled={!isComplete || submittingMode !== null} onClick={() => finish('algorithm')}>
                {submittingMode === 'algorithm' ? t('test.submittingAlgorithm') : t('test.algorithmResult')}
              </Button>
              <Button type="button" variant="secondary" disabled={!isComplete || submittingMode !== null} onClick={() => finish('ai')}>
                {submittingMode === 'ai' ? t('test.submittingAi') : t('test.aiResult')}
              </Button>
              {!isComplete ? (
                <Button type="button" variant="ghost" onClick={goToFirstUnanswered}>
                  {t('test.reviewMissing')}
                </Button>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>
    </Section>
  )
}
