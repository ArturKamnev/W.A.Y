import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Badge, Card, Section } from '../components/ui'
import { mediaAssets } from '../data/media'

const homeSteps = [
  ['01', 'home.steps.oneTitle', 'home.steps.oneBody'],
  ['02', 'home.steps.twoTitle', 'home.steps.twoBody'],
  ['03', 'home.steps.threeTitle', 'home.steps.threeBody'],
]

const benefits = [
  ['A', 'home.benefits.clarityTitle', 'home.benefits.clarityBody'],
  ['B', 'home.benefits.depthTitle', 'home.benefits.depthBody'],
  ['C', 'home.benefits.futureTitle', 'home.benefits.futureBody'],
]

const slideCount = 5
const ease = [0.22, 1, 0.36, 1] as const

const group = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.68,
      ease,
      staggerChildren: 0.09,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.58, ease } },
}

function canUseControlledScroll() {
  return (
    window.matchMedia('(min-width: 961px)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function HomePage() {
  const { t } = useTranslation()
  const storyRef = useRef<HTMLDivElement | null>(null)
  const activeRef = useRef(0)
  const lockRef = useRef(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [useRevealMotion, setUseRevealMotion] = useState(false)

  const setActive = useCallback((index: number) => {
    activeRef.current = index
    setActiveIndex(index)
  }, [])

  const goToSlide = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(slideCount - 1, index))
      lockRef.current = true
      setActive(next)
      window.setTimeout(() => {
        lockRef.current = false
      }, 760)
    },
    [setActive],
  )

  useEffect(() => {
    const syncMotionPreference = () => setUseRevealMotion(canUseControlledScroll())
    syncMotionPreference()
    window.addEventListener('resize', syncMotionPreference)

    return () => {
      window.removeEventListener('resize', syncMotionPreference)
    }
  }, [])

  useEffect(() => {
    const root = storyRef.current
    if (!root) return undefined

    const onWheel = (event: WheelEvent) => {
      if (!canUseControlledScroll() || Math.abs(event.deltaY) < 18) return
      const direction = event.deltaY > 0 ? 1 : -1
      const next = activeRef.current + direction

      if (next < 0 || next >= slideCount) return
      event.preventDefault()
      if (lockRef.current) return
      goToSlide(next)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!canUseControlledScroll()) return
      const nextKeys = ['ArrowDown', 'PageDown', ' ']
      const prevKeys = ['ArrowUp', 'PageUp']
      if (nextKeys.includes(event.key)) {
        const next = activeRef.current + 1
        if (next < slideCount) {
          event.preventDefault()
          goToSlide(next)
        }
      }
      if (prevKeys.includes(event.key)) {
        const previous = activeRef.current - 1
        if (previous >= 0) {
          event.preventDefault()
          goToSlide(previous)
        }
      }
    }

    root.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      root.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [goToSlide])

  const revealInitial = useRevealMotion ? 'hidden' : 'visible'
  const visualInitial = useRevealMotion ? { opacity: 0, scale: 0.96, y: 26 } : { opacity: 1, scale: 1, y: 0 }
  const blockInitial = useRevealMotion ? { opacity: 0, y: 24 } : { opacity: 1, y: 0 }
  const actionInitial = useRevealMotion ? { opacity: 0, y: 18 } : { opacity: 1, y: 0 }

  return (
    <div className="landing-story" ref={storyRef}>
      <div className="landing-progress" aria-hidden="true">
        {Array.from({ length: slideCount }).map((_, index) => (
          <motion.button
            className={activeIndex === index ? 'is-active' : undefined}
            key={index}
            layout
            type="button"
            onClick={() => goToSlide(index)}
            tabIndex={-1}
            transition={{ duration: 0.45, ease }}
          />
        ))}
      </div>

      <div className="landing-track" style={{ transform: `translate3d(0, -${activeIndex * 100}%, 0)` }}>
        <section className="hero landing-slide" data-slide-index="0">
          <div className="hero__inner">
            <motion.div
              className="hero__copy"
              animate="visible"
              initial={revealInitial}
              key={`hero-${activeIndex === 0}`}
              variants={group}
            >
              <motion.p className="section__eyebrow" variants={item}>
                {t('home.eyebrow')}
              </motion.p>
              <motion.h1 variants={item}>{t('home.headline')}</motion.h1>
              <motion.p variants={item}>{t('home.support')}</motion.p>
              <motion.div className="hero__actions" variants={item}>
                <Link className="button button--primary" to="/onboarding">
                  {t('home.primaryCta')}
                </Link>
                <Link className="button button--secondary" to="/professions">
                  {t('home.secondaryCta')}
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="hero-visual card"
              animate={{ opacity: 1, scale: 1, y: 0 }}
              initial={visualInitial}
              transition={{ delay: 0.12, duration: 0.72, ease }}
            >
              <img alt={t(mediaAssets.hero.altKey)} src={mediaAssets.hero.url} />
              <div className="hero-visual__overlay" />
              <div className="path-lines" />
              <div className="hero-visual__panel glass">
                <Badge>{t('brand.slogan')}</Badge>
                <strong>{t('home.visualTitle')}</strong>
                <p>{t('home.visualBody')}</p>
              </div>
            </motion.div>
          </div>
        </section>

        <Section
          className="landing-slide landing-slide--center"
          data-slide-index="1"
          eyebrow={t('home.howEyebrow')}
          lead={t('home.howLead')}
          title={t('home.howTitle')}
        >
        <motion.div
          className="grid grid--3 motion-grid"
          initial={revealInitial}
          variants={group}
          viewport={{ amount: 0.34, once: false }}
          whileInView="visible"
        >
          {homeSteps.map(([icon, title, body]) => (
            <motion.div key={title} variants={item}>
              <Card className="value-card">
                <span className="feature-icon">{icon}</span>
                <h3>{t(title)}</h3>
                <p>{t(body)}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        </Section>

        <Section
          className="landing-slide landing-slide--center"
          data-slide-index="2"
          eyebrow={t('home.whyEyebrow')}
          lead={t('home.whyLead')}
          title={t('home.whyTitle')}
        >
        <motion.div
          className="grid grid--3 motion-grid"
          initial={revealInitial}
          variants={group}
          viewport={{ amount: 0.34, once: false }}
          whileInView="visible"
        >
          {benefits.map(([icon, title, body]) => (
            <motion.div key={title} variants={item}>
              <Card className="value-card">
                <span className="feature-icon">{icon}</span>
                <h3>{t(title)}</h3>
                <p>{t(body)}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        </Section>

        <Section
          className="landing-slide landing-slide--split"
          data-slide-index="3"
          lead={t('home.audienceLead')}
          title={t('home.audienceTitle')}
        >
        <motion.div
          className="audience-panel"
          initial={blockInitial}
          viewport={{ amount: 0.42, once: false }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.62, ease }}
        >
          <div>
            <span className="feature-icon">S</span>
            <h3>{t('professions.categories.social')}</h3>
            <p>{t('home.steps.threeBody')}</p>
          </div>
          <div>
            <span className="feature-icon">M</span>
            <h3>{t('about.team.research')}</h3>
            <p>{t('about.helpBody')}</p>
          </div>
        </motion.div>
        </Section>

        <Section
          className="landing-slide cta-section"
          data-slide-index="4"
          lead={t('home.ctaBody')}
          title={t('home.ctaTitle')}
        >
        <motion.div
          className="page-actions"
          initial={actionInitial}
          viewport={{ amount: 0.6, once: false }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, ease }}
        >
          <Link className="button button--primary" to="/onboarding">
            {t('nav.start')}
          </Link>
          <Link className="button button--secondary" to="/guide">
            {t('nav.guide')}
          </Link>
        </motion.div>
        </Section>
      </div>
    </div>
  )
}
