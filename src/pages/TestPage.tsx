import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Card, LoadingState, ProgressBar, Section } from '../components/ui'
import { repositories } from '../services/repositories'
import { useAuthStore, useSavedItemsStore, useTestStore } from '../store/useStores'
import type { Question } from '../types/models'

export function TestPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const session = useAuthStore((state) => state.session)
  const { answers, currentIndex, lastSavedAt, setAnswer, setCurrentIndex, resetTest } = useTestStore()
  const setLatestResult = useSavedItemsStore((state) => state.setLatestResult)

  useEffect(() => {
    let active = true
    repositories.questions.getQuestions().then((items) => {
      if (!active) return
      setQuestions(items)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const currentQuestion = questions[currentIndex]
  const selectedOptionId = currentQuestion ? answers[currentQuestion.id]?.optionId : undefined
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  const goToIndex = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, questions.length - 1)))
  }

  const finish = async () => {
    if (!session) {
      navigate('/login')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const result = await repositories.results.submitTest({
        answers: Object.values(answers),
        completedAt: new Date().toISOString(),
      })
      setLatestResult(result)
      resetTest()
      navigate('/results', { replace: true })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('common.empty'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !currentQuestion) {
    return (
      <Section eyebrow={t('test.eyebrow')} title={t('test.title')}>
        <LoadingState label={t('common.loading')} />
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
                onClick={() =>
                  setAnswer({
                    questionId: currentQuestion.id,
                    optionId: option.id,
                    value: option.value,
                    tags: option.tags,
                  })
                }
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
          <Button type="button" variant="ghost" onClick={() => goToIndex(currentIndex + 1)}>
            {t('test.skip')}
          </Button>
          {currentIndex === questions.length - 1 ? (
            <Button type="button" disabled={submitting || answeredCount === 0} onClick={finish}>
              {t('test.finish')}
            </Button>
          ) : (
            <Button type="button" onClick={() => goToIndex(currentIndex + 1)}>
              {t('test.next')}
            </Button>
          )}
          {lastSavedAt ? <Badge>{t('test.autosaved')}</Badge> : null}
        </div>
        {submitError ? <p className="field__error">{submitError}</p> : null}
      </div>
    </Section>
  )
}
