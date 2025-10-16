import { useEffect, useState } from 'react'
import { useI18n } from '../useI18n'
import { useAuth } from '../useAuth'

export default function Sidebar() {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Habilita layout com sidebar e aplica estado colapsado
    document.body.classList.add('has-sidebar')
    return () => { document.body.classList.remove('has-sidebar'); document.body.classList.remove('sidebar-collapsed') }
  }, [])

  useEffect(() => {
    if (collapsed) document.body.classList.add('sidebar-collapsed')
    else document.body.classList.remove('sidebar-collapsed')
  }, [collapsed])

  const isDesktop = () => {
    try { return window.matchMedia('(min-width: 1024px)').matches } catch { return true }
  }

  useEffect(() => {
    const toggle = () => {
      if (isDesktop()) setCollapsed((c) => !c)
      else setOpen((o) => !o)
    }
    window.addEventListener('app:sidebar:toggle', toggle)
    return () => window.removeEventListener('app:sidebar:toggle', toggle)
  }, [])

  useEffect(() => {
    // Bloqueia rolagem apenas em mobile quando sidebar aberta
    if (!isDesktop()) {
      try {
        if (open) document.body.classList.add('no-scroll')
        else document.body.classList.remove('no-scroll')
      } catch {}
    }
    return () => { document.body.classList.remove('no-scroll') }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isDesktop()) setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (tab: 'register' | 'history' | 'stats' | 'dogs' | 'profile' | 'about') => {
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab } }))
    if (!isDesktop()) setOpen(false)
  }

  return (
    <>
    {/* Overlay somente em mobile quando aberto */}
    {!isDesktop() && open && <div className="sidebar__overlay" onClick={() => setOpen(false)} aria-hidden="true" />}
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${(!isDesktop() && open) ? 'sidebar--open' : ''}`} aria-label="Main navigation">
      <div className="sidebar__header">
        {isDesktop() ? (
          <button type="button" className="btn btn-chip btn-ghost sidebar__toggle" aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? '›' : '‹'}
          </button>
        ) : (
          <button type="button" className="btn btn-chip btn-ghost sidebar__toggle" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen((o) => !o)}>
            {open ? '✕' : '☰'}
          </button>
        )}
        {!collapsed && <div className="sidebar__brand">🐾 {t('app.title')}</div>}
      </div>
      <nav className="sidebar__nav">
        <a href="#" className="sidebar__item" title={t('tabs.register')} onClick={(e) => { e.preventDefault(); go('register') }}>📝 <span className="sidebar__label">{t('tabs.register')}</span></a>
        <a href="#" className="sidebar__item" title={t('tabs.history')} onClick={(e) => { e.preventDefault(); go('history') }}>📚 <span className="sidebar__label">{t('tabs.history')}</span></a>
        <a href="#" className="sidebar__item" title={t('tabs.stats')} onClick={(e) => { e.preventDefault(); go('stats') }}>📊 <span className="sidebar__label">{t('tabs.stats')}</span></a>
        <a href="#" className="sidebar__item" title={t('tabs.dogs')} onClick={(e) => { e.preventDefault(); go('dogs') }}>🦴 <span className="sidebar__label">{t('tabs.dogs')}</span></a>
        <a href="#" className="sidebar__item" title={t('tabs.profile')} onClick={(e) => { e.preventDefault(); go('profile') }}>👤 <span className="sidebar__label">{t('tabs.profile')}</span></a>
        <a href="#" className="sidebar__item" title={t('tabs.about')} onClick={(e) => { e.preventDefault(); go('about') }}>ℹ️ <span className="sidebar__label">{t('tabs.about')}</span></a>
      </nav>
      <div className="sidebar__footer">
        {user && (
          <div className="sidebar__user">
            {user.photoDataUrl ? (
              <img src={user.photoDataUrl} alt={user.name} className="sidebar__avatar" />
            ) : (
              <div className="sidebar__avatar" aria-hidden>👤</div>
            )}
            {!collapsed && (
              <div className="sidebar__userInfo">
                <div className="sidebar__userName">{user.name}</div>
                <div className="sidebar__userEmail">{user.email}</div>
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          className="btn btn-chip btn-danger"
          title={t('profile.menu.logout')}
          aria-label={t('profile.menu.logout')}
          onClick={() => { logout(); if (!isDesktop()) setOpen(false) }}
          style={{ marginTop: 8 }}
        >
          {collapsed ? '⎋' : t('profile.menu.logout')}
        </button>
      </div>
    </aside>
    </>
  )
}