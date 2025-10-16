import { createContext } from 'react'

export type Language = 'en' | 'pt-BR'

export type I18nContextType = {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string) => string
}

export const I18nContext = createContext<I18nContextType | null>(null)