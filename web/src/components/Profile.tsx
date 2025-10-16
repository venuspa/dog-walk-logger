import { useMemo } from 'react'
import { useI18n } from '../useI18n'
import { useAuth } from '../useAuth'
import type { WalkEntry } from './WalkForm'

function loadWalks(): WalkEntry[] {
  try {
    const raw = localStorage.getItem('dwl_walks')
    const list: WalkEntry[] = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch { return [] }
}

export default function Profile() {
  const { t, lang } = useI18n()
  const { user } = useAuth()

  const userWalks = useMemo(() => {
    const all = loadWalks()
    if (!user?.email) return all
    return all.filter((w) => w.ownerEmail === user.email)
  }, [user?.email])

  const formatDate = (iso?: string) => {
    if (!iso) return '—'
    try {
      return new Intl.DateTimeFormat(lang === 'pt-BR' ? 'pt-BR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
    } catch { return iso }
  }

  return (
    <section className="container">
      <div className="card">
        <div className="card__header" style={{ alignItems: 'center', gap: 16 }}>
          <h2 className="card__title">{t('profile.title')}</h2>
        </div>
        <div className="row" style={{ alignItems: 'center', gap: 16 }}>
          {user?.photoDataUrl ? (
            <img src={user.photoDataUrl} alt={user.name} style={{ width: 80, height: 80, borderRadius: 40, objectFit: 'cover', border: '1px solid var(--border)' }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>👤</div>
          )}
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{user?.name}</div>
            <div className="muted" style={{ fontSize: 14 }}>{user?.email}</div>
            <div className="muted" style={{ marginTop: 8 }}>{t('profile.since').replace('{date}', formatDate(user?.createdAtISO))}</div>
          </div>
        </div>

        <div className="cards-grid" style={{ marginTop: 16 }}>
          <article className="card appear">
            <h3 className="card__title">🐾 {t('profile.stats.total_walks')}</h3>
            <div className="row"><span className="badge">{userWalks.length}</span></div>
          </article>
        </div>
      </div>
    </section>
  )
}