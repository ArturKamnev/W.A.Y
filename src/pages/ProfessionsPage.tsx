import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CareerCard } from '../components/domain/Cards'
import { Badge, EmptyState, Field, Input, Modal, Select, Section } from '../components/ui'
import { repositories } from '../services/repositories'
import { useSavedItemsStore } from '../store/useStores'
import type { Profession, ProfessionCategory } from '../types/models'

const categories: Array<ProfessionCategory | 'all'> = ['all', 'technology', 'creative', 'science', 'business', 'social', 'health']

export function ProfessionsPage() {
  const { t, i18n } = useTranslation()
  const [category, setCategory] = useState<ProfessionCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const [professions, setProfessions] = useState<Profession[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const toggleProfession = useSavedItemsStore((state) => state.toggleProfession)
  const savedIds = useSavedItemsStore((state) => state.savedProfessionIds)

  const handleSave = async (professionId: string, saved: boolean) => {
    if (saved) {
      await repositories.professions.removeProfession(professionId).catch(() => undefined)
    } else {
      await repositories.professions.saveProfession(professionId).catch(() => undefined)
    }
    toggleProfession(professionId)
  }

  useEffect(() => {
    let active = true
    repositories.professions.listProfessions({ category, query }).then((items) => {
      if (active) setProfessions(items)
    })
    return () => {
      active = false
    }
  }, [category, query])

  const selected = useMemo(() => professions.find((profession) => profession.id === selectedId), [professions, selectedId])

  return (
    <Section eyebrow={t('professions.eyebrow')} title={t('professions.title')} lead={t('professions.lead')}>
      <div className="filter-row" style={{ marginTop: 'var(--space-6)' }}>
        <Field label={t('professions.filterLabel')}>
          <Select value={category} onChange={(event) => setCategory(event.target.value as ProfessionCategory | 'all')}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {t(`professions.categories.${item}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('common.search')}>
          <Input value={query} placeholder={t('professions.searchPlaceholder')} onChange={(event) => setQuery(event.target.value)} />
        </Field>
      </div>

      {professions.length ? (
        <div className="grid grid--3" style={{ marginTop: 'var(--space-6)' }}>
          {professions.map((profession) => (
            <CareerCard
              key={profession.id}
              profession={profession}
              saved={savedIds.includes(profession.id)}
              onDetails={() => setSelectedId(profession.id)}
              onSave={() => void handleSave(profession.id, savedIds.includes(profession.id))}
            />
          ))}
        </div>
      ) : (
        <EmptyState title={t('common.empty')} />
      )}

      <Modal
        title={selected ? (i18n.language === 'ru' && selected.titleRu ? selected.titleRu : selected.titleEn ?? t(selected.titleKey)) : ''}
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
      >
        {selected ? (
          <div className="grid">
            <p>{i18n.language === 'ru' && selected.descriptionRu ? selected.descriptionRu : selected.descriptionEn ?? t(selected.descriptionKey)}</p>
            <div className="detail-block">
              <h3>{t('professions.details.does')}</h3>
              <p>{t(selected.details.doesKey)}</p>
            </div>
            <div className="detail-block">
              <h3>{t('professions.details.suits')}</h3>
              <p>{t(selected.details.suitsKey)}</p>
            </div>
            <div className="detail-block">
              <h3>{t('professions.details.skills')}</h3>
              <div className="tag-list">
                {selected.details.skillsKeys.map((skill) => (
                  <Badge key={skill}>{t(skill)}</Badge>
                ))}
              </div>
            </div>
            <div className="detail-block">
              <h3>{t('professions.details.steps')}</h3>
              <div className="grid">
                {selected.details.firstStepsKeys.map((step) => (
                  <p key={step}>{t(step)}</p>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </Section>
  )
}
