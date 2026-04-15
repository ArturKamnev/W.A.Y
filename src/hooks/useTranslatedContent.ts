import { useTranslation } from 'react-i18next'

export function useTranslatedContent() {
  const { t } = useTranslation()

  return {
    t,
    list: (keys: string[]) => keys.map((key) => t(key)),
  }
}
