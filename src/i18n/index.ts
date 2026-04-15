import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en/common.json'
import ru from './locales/ru/common.json'

export const resources = {
  en: { common: en },
  ru: { common: ru },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: 'ru',
  fallbackLng: 'ru',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
