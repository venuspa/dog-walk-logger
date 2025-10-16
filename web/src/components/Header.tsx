import { useI18n } from '../useI18n'
import { useEffect } from 'react'

export default function Header() {
  const { t, lang, setLang } = useI18n()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { /* noop */ } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="header">
      <div className="container header__inner">
        <div className="brand" aria-label={t('app.title')}>
          <span className="brand__emoji" aria-hidden>🐾</span>
          <span className="brand__text">{t('app.title')}</span>
        </div>
        <div className="lang-switch" aria-label={t('header.language')}>
          <button
            type="button"
            className="btn btn-chip btn-ghost lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'pt-BR' : 'en')}
            aria-label={lang === 'en' ? t('header.toggle_pt') : t('header.toggle_en')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span aria-hidden>🌐</span>
            <span className="hide-sm">{lang === 'en' ? 'EN' : 'PT'}</span>
          </button>
        </div>
        <button
          type="button"
          className="btn btn-chip btn-ghost"
          aria-label="Menu"
          onClick={() => { window.dispatchEvent(new Event('app:sidebar:toggle')) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span aria-hidden>☰</span>
          <span className="hide-sm">Menu</span>
        </button>
        {/* Removido: menu de perfil no topo para evitar duplicação com a Sidebar */}
      </div>
    </header>
  )
}