import { useTranslation } from 'react-i18next'
import { Select } from '../ui'
import { usePreferencesStore } from '../../store/useStores'
import type { Language } from '../../types/models'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const language = usePreferencesStore((state) => state.language)
  const setLanguage = usePreferencesStore((state) => state.setLanguage)

  const handleChange = (value: Language) => {
    setLanguage(value)
    void i18n.changeLanguage(value)
  }

  return (
    <label className="field" aria-label={t('nav.language')}>
      <span className="sr-only">{t('nav.language')}</span>
      <Select value={language} onChange={(event) => handleChange(event.target.value as Language)}>
        <option value="en">EN</option>
        <option value="ru">RU</option>
      </Select>
    </label>
  )
}
