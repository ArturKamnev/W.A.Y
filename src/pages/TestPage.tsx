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
  const [loadingError, setLoadingError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const session = useAuthStore((state) => state.session)
  const { answers, currentIndex, lastSavedAt, setAnswer, setCurrentIndex, resetTest, replaceAnswers } = useTestStore()
  const setLatestResult = useSavedItemsStore((state) => state.setLatestResult)

  useEffect(() => {
  let active = true

  repositories.questions
    .getQuestions()
    .then((items) => {
      if (!active) return

      setQuestions(items)

      const validQuestionMap = new Map(items.map((question) => [question.id, question]))
      const cleanedAnswers = Object.fromEntries(
        Object.entries(answers).filter(([questionId, answer]) => {
          const question = validQuestionMap.get(questionId)
          if (!question) return false
          return question.options.some((option) => option.id === answer.optionId)
        }),
      )

      if (Object.keys(cleanedAnswers).length !== Object.keys(answers).length) {
        replaceAnswers(cleanedAnswers)
      }

      setLoading(false)
    })
    .catch(() => {
      if (!active) return
      setQuestions([])
      setLoading(false)
    })

  return () => {
    active = false
  }
}, [answers, replaceAnswers])

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
    const validQuestionMap = new Map(questions.map((question) => [question.id, question]))

    const validAnswers = Object.values(answers).filter((answer) => {
      const question = validQuestionMap.get(answer.questionId)
      if (!question) return false
      return question.options.some((option) => option.id === answer.optionId)
    })

    if (!validAnswers.length) {
      setSubmitError('Ответы устарели. Пожалуйста, пройдите тест заново.')
      resetTest()
      navigate('/test', { replace: true })
      return
    }

    const result = await repositories.results.submitTest({
      answers: validAnswers,
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

  if (loading) {
    return (
      <Section eyebrow={t('test.eyebrow')} title={t('test.title')}>
        <LoadingState label={t('common.loading')} />
      </Section>
    )
  }

  if (loadingError || !currentQuestion) {
    return (
      <Section eyebrow={t('test.eyebrow')} title={t('test.title')} lead={loadingError || t('common.empty')}>
        <Button type="button" onClick={() => window.location.reload()}>
          {t('common.retry')}
        </Button>
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
