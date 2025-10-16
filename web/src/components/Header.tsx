import { useI18n } from '../useI18n'
import { useAuth } from '../useAuth'
import { useEffect, useRef, useState } from 'react'

export default function Header() {
  const { t, lang, setLang } = useI18n()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
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
            className={`btn btn-chip ${lang === 'en' ? 'btn-chip--active' : ''}`}
            onClick={() => setLang('en')}
          >
            {t('header.toggle_en')}
          </button>
          <button
            type="button"
            className={`btn btn-chip ${lang === 'pt-BR' ? 'btn-chip--active' : ''}`}
            onClick={() => setLang('pt-BR')}
          >
            {t('header.toggle_pt')}
          </button>
        </div>
        {user && (
          <div className="profile-menu" ref={menuRef} style={{ position: 'relative', marginLeft: 12 }}>
            <button
              type="button"
              className="btn btn-chip"
              aria-label="profile"
              onClick={() => setMenuOpen((o) => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {user.photoDataUrl ? (
                <img src={user.photoDataUrl} alt={user.name} style={{ width: 24, height: 24, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)' }} />
              ) : (
                <span aria-hidden>👤</span>
              )}
              <span style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</span>
            </button>
            {menuOpen && (
              <div className="dropdown" role="menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.08)', minWidth: 200, zIndex: 10 }}>
                <a href="#" className="dropdown__item" onClick={(e) => { e.preventDefault(); setMenuOpen(false); window.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab: 'profile' } })) }}>
                  {t('profile.menu.profile')}
                </a>
                <a href="#" className="dropdown__item" onClick={(e) => { e.preventDefault(); setMenuOpen(false); window.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab: 'dogs' } })) }}>
                  {t('profile.menu.settings')}
                </a>
                <div style={{ borderTop: '1px solid var(--border)' }} />
                <a href="#" className="dropdown__item" onClick={(e) => { e.preventDefault(); setMenuOpen(false); logout() }}>
                  {t('profile.menu.logout')}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}