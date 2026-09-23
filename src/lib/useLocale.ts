import { useTranslation } from 'react-i18next'
import type { L10n } from '@/content/schema'
import type { Locale } from './format'

/** Current UI locale plus a helper to pick bilingual content. */
export function useLocale(): { locale: Locale; pick: (l: L10n) => string } {
  const { i18n } = useTranslation()
  const locale: Locale = (i18n.resolvedLanguage ?? i18n.language ?? 'es').startsWith('en')
    ? 'en'
    : 'es'
  return { locale, pick: (l: L10n) => l[locale] }
}
