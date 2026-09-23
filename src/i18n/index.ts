import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import es from './es.json'

export const SUPPORTED_LOCALES = ['es', 'en'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const resources = {
  es: { translation: es },
  en: { translation: en },
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: SUPPORTED_LOCALES,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'titra.locale',
      caches: ['localStorage'],
    },
    returnNull: false,
  })

export function currentLocale(): AppLocale {
  const lng = i18n.resolvedLanguage ?? i18n.language ?? 'es'
  return lng.startsWith('en') ? 'en' : 'es'
}

export function setLocale(locale: AppLocale): void {
  void i18n.changeLanguage(locale)
  document.documentElement.lang = locale
}

export default i18n
