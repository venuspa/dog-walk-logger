import { useState } from 'react'
import Header from './components/Header'
import WalkForm from './components/WalkForm'
import type { WalkEntry } from './components/WalkForm'
import HistoryDashboard from './components/HistoryDashboard'
import { Suspense, lazy, useEffect } from 'react'
const StatsDashboard = lazy(() => import('./components/StatsDashboard'))
import About from './components/About'
import DogsManager from './components/DogsManager'
import Profile from './components/Profile'
import Footer from './components/Footer'
import { useI18n } from './useI18n'
import { useAuth } from './useAuth'
import Welcome from './components/Welcome'
import Login from './components/Login'
import Register from './components/Register'

function App() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [tab, setTab] = useState<'register' | 'history' | 'stats' | 'dogs' | 'profile' | 'about'>('register')
  const [editing, setEditing] = useState<WalkEntry | null>(null)
  const [formDirty, setFormDirty] = useState(false)
  const [authTab, setAuthTab] = useState<'welcome' | 'login' | 'register'>('welcome')
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ tab: typeof tab }>
        const next = ce.detail?.tab
        if (!next) return
        safeSetTab(next)
      } catch {}
    }
    window.addEventListener('app:navigate', handler as EventListener)
    return () => window.removeEventListener('app:navigate', handler as EventListener)
  }, [tab])

  const safeSetTab = (next: typeof tab) => {
    if (tab === 'register' && formDirty) {
      const ok = window.confirm(t('form.confirm_leave'))
      if (!ok) return
    }
    setTab(next)
    try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch {}
  }

  const goRegister = () => { safeSetTab('register') }
  const goHistory = () => { setEditing(null); safeSetTab('history') }

  if (!user) {
    return (
      <div className="app">
        <Header />
        <main>
          {authTab === 'welcome' && (
            <Welcome onGoLogin={() => setAuthTab('login')} onGoRegister={() => setAuthTab('register')} />
          )}
          {authTab === 'login' && (
            <Login onSuccess={() => { setAuthTab('welcome'); setTab('history') }} onGoRegister={() => setAuthTab('register')} />
          )}
          {authTab === 'register' && (
            <Register onSuccess={() => { setAuthTab('welcome'); setTab('history') }} onGoLogin={() => setAuthTab('login')} />
          )}
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <nav className="tabs container" aria-label="sections">
        <button className={`btn btn-tab ${tab === 'register' ? 'btn-tab--active' : ''}`} onClick={goRegister} aria-label={t('tabs.register')}>📝 {t('tabs.register')}</button>
        <button className={`btn btn-tab ${tab === 'history' ? 'btn-tab--active' : ''}`} onClick={goHistory} aria-label={t('tabs.history')}>📚 {t('tabs.history')}</button>
        <button className={`btn btn-tab ${tab === 'stats' ? 'btn-tab--active' : ''}`} onClick={() => safeSetTab('stats')} aria-label={t('tabs.stats')}>📊 {t('tabs.stats')}</button>
        <button className={`btn btn-tab ${tab === 'dogs' ? 'btn-tab--active' : ''}`} onClick={() => safeSetTab('dogs')} aria-label={t('tabs.dogs')}>🦴 {t('tabs.dogs')}</button>
        <button className={`btn btn-tab ${tab === 'profile' ? 'btn-tab--active' : ''}`} onClick={() => safeSetTab('profile')} aria-label={t('tabs.profile')}>👤 {t('tabs.profile')}</button>
        <button className={`btn btn-tab ${tab === 'about' ? 'btn-tab--active' : ''}`} onClick={() => safeSetTab('about')} aria-label={t('tabs.about')}>ℹ️ {t('tabs.about')}</button>
      </nav>
      <main>
        {tab === 'register' && (
          <WalkForm
            initialEntry={editing ?? undefined}
            onSaved={() => { setEditing(null); setTab('history') }}
            onCancel={() => { setEditing(null); setTab('history') }}
            onDirtyChange={(d) => setFormDirty(d)}
          />
        )}

        {tab === 'history' && (
          <HistoryDashboard onEdit={(entry) => { setEditing(entry); setTab('register') }} onGoRegister={() => setTab('register')} />
        )}

        {tab === 'stats' && (
          <Suspense fallback={<div className="container"><div className="card"><div className="spinner" aria-busy="true" aria-live="polite">Loading…</div></div></div>}>
            <StatsDashboard onGoRegister={() => setTab('register')} />
          </Suspense>
        )}

        {tab === 'dogs' && (
          <DogsManager />
        )}

        {tab === 'profile' && (
          <Profile />
        )}

        {tab === 'about' && (
          <About />
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App
