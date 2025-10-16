import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../useI18n'
import { useToast } from './useToast'
import { useAuth } from '../useAuth'
import { loadDogs } from '../auth'
import type { DogProfile } from '../auth'

type Weather = 'sunny' | 'cloudy' | 'rainy' | 'windy'

type WalkEntry = {
  id: string
  ownerEmail?: string
  dogId?: string
  dogName: string
  datetimeISO: string
  durationMinutes: number
  distanceKm: number
  route?: string
  weather: Weather
  energy: number
  notes?: string
  photoDataUrl?: string
  createdAtISO: string
}

function loadWalks(): WalkEntry[] {
  try {
    const raw = localStorage.getItem('dwl_walks')
    if (!raw) return []
    const list: WalkEntry[] = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function deleteWalk(id: string) {
  const list = loadWalks()
  const next = list.filter((w) => w.id !== id)
  localStorage.setItem('dwl_walks', JSON.stringify(next))
}

function formatDate(dtISO: string, locale: string) {
  try {
    const d = new Date(dtISO)
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return dtISO
  }
}

function weatherIcon(w: Weather) {
  switch (w) {
    case 'sunny': return '☀️'
    case 'cloudy': return '☁️'
    case 'rainy': return '🌧️'
    case 'windy': return '🌬️'
  }
}

type SortKey = 'date_desc' | 'date_asc' | 'duration' | 'distance'

type FilterState = {
  dogName: string
  startDate: string
  endDate: string
  weathers: Weather[]
  query: string
}

const PAGE_SIZE = 12

export default function HistoryDashboard({
  onEdit,
  onGoRegister,
}: {
  onEdit?: (entry: WalkEntry) => void
  onGoRegister?: () => void
}) {
  const { t, lang } = useI18n()
  const { show } = useToast()
  const { user } = useAuth()

  const [allWalks, setAllWalks] = useState<WalkEntry[]>([])
  const [dogs, setDogs] = useState<DogProfile[]>([])
  const [sort, setSort] = useState<SortKey>('date_desc')
  const [filters, setFilters] = useState<FilterState>({ dogName: '', startDate: '', endDate: '', weathers: [], query: '' })
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const all = loadWalks()
    const scoped = user ? all.filter((w) => !w.ownerEmail || w.ownerEmail === user.email) : all
    setAllWalks(scoped)
  }, [user])

  useEffect(() => {
    if (!user) { setDogs([]); return }
    setDogs(loadDogs(user.email))
  }, [user])

  // Debounce search input into filters.query
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((prev) => ({ ...prev, query: searchText }))
    }, 300)
    return () => clearTimeout(id)
  }, [searchText])

  const dogNames = useMemo(() => {
    const s = new Set(allWalks.map((w) => w.dogName))
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [allWalks])

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    const start = filters.startDate ? new Date(filters.startDate) : null
    const end = filters.endDate ? new Date(filters.endDate) : null

    return allWalks.filter((w) => {
      if (filters.dogName && w.dogName !== filters.dogName) return false
      const dt = new Date(w.datetimeISO)
      if (start && dt < start) return false
      if (end && dt > end) return false
      if (filters.weathers.length && !filters.weathers.includes(w.weather)) return false
      if (q) {
        const hay = `${w.dogName} ${w.notes ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [allWalks, filters])

  const sorted = useMemo(() => {
    const list = [...filtered]
    switch (sort) {
      case 'date_desc':
        return list.sort((a, b) => +new Date(b.datetimeISO) - +new Date(a.datetimeISO))
      case 'date_asc':
        return list.sort((a, b) => +new Date(a.datetimeISO) - +new Date(b.datetimeISO))
      case 'duration':
        return list.sort((a, b) => b.durationMinutes - a.durationMinutes)
      case 'distance':
        return list.sort((a, b) => b.distanceKm - a.distanceKm)
      default:
        return list
    }
  }, [filtered, sort])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageItems = useMemo(() => {
    const startIdx = (page - 1) * PAGE_SIZE
    return sorted.slice(startIdx, startIdx + PAGE_SIZE)
  }, [sorted, page])

  useEffect(() => {
    // Reset to first page when filters change
    setPage(1)
  }, [filters, sort])

  const toggleWeather = (w: Weather) => {
    setFilters((prev) => {
      const set = new Set(prev.weathers)
      if (set.has(w)) set.delete(w)
      else set.add(w)
      return { ...prev, weathers: Array.from(set) as Weather[] }
    })
  }

  const clearFilters = () => {
    setFilters({ dogName: '', startDate: '', endDate: '', weathers: [], query: '' })
    setSearchText('')
  }

  const handleDelete = (id: string) => {
    const ok = window.confirm(t('history.confirm_delete'))
    if (!ok) return
    try {
      deleteWalk(id)
      setAllWalks(loadWalks())
      setStatusMsg(t('history.deleted'))
      setErrorMsg(null)
      show(t('toast.deleted'), 'success')
    } catch {
      setErrorMsg(t('history.error_delete'))
      setStatusMsg(null)
      show(t('history.error_delete'), 'error')
    }
  }

  const onEditClick = (entry: WalkEntry) => {
    onEdit?.(entry)
  }

  return (
    <section className="container">
      <div className="card">
        <h2 className="card__title">{t('history.title')} 🐾</h2>

        <div className="filters">
          <div className="filters__row">
            <div className="field">
              <label className="label" htmlFor="sort">{t('history.sort_by')}</label>
              <select id="sort" className="select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="date_desc">{t('history.sort.date_desc')}</option>
                <option value="date_asc">{t('history.sort.date_asc')}</option>
                <option value="duration">{t('history.sort.duration')}</option>
                <option value="distance">{t('history.sort.distance')}</option>
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="dog">{t('history.filter.dog')}</label>
              <select id="dog" className="select" value={filters.dogName} onChange={(e) => setFilters({ ...filters, dogName: e.target.value })}>
                <option value="">{t('history.filter.any')}</option>
                {dogNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="query">{t('history.search')}</label>
              <input id="query" className="input" type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={t('history.search.placeholder')} />
            </div>
          </div>

          <div className="filters__row">
            <div className="field">
              <label className="label" htmlFor="start">{t('history.filter.start')}</label>
              <input id="start" className="input" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="end">{t('history.filter.end')}</label>
              <input id="end" className="input" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
            <div className="field">
              <span className="label">{t('history.filter.weather')}</span>
              <div className="chips">
                {(['sunny','cloudy','rainy','windy'] as Weather[]).map((w) => (
                  <button key={w} type="button" className={`btn btn-chip ${filters.weathers.includes(w) ? 'btn-chip--active' : ''}`} onClick={() => toggleWeather(w)}>
                    {t(`form.weather.${w}`)} {weatherIcon(w)}
                  </button>
                ))}
              </div>
            </div>
            <div className="actions">
              <button type="button" className="btn" onClick={clearFilters}>{t('history.clear_filters')}</button>
            </div>
          </div>
        </div>

        <div className="results__meta">
          <span className="muted">{t('history.total',).replace('{count}', String(total))}</span>
        </div>

        {statusMsg && <div className="alert alert--success" role="status" aria-live="polite">{statusMsg}</div>}
        {errorMsg && <div className="alert alert--error" role="alert" aria-live="assertive">{errorMsg}</div>}

        {total === 0 ? (
          <div className="empty">
            <p>{t('history.empty')}</p>
            <div className="actions">
              <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); onGoRegister?.() }}>{t('history.go_register')}</a>
            </div>
          </div>
        ) : (
          <div className="cards-grid">
            {pageItems.map((w) => {
              const dogPhoto = w.dogId ? dogs.find((d) => d.id === w.dogId)?.photoDataUrl : undefined
              const photo = dogPhoto ?? w.photoDataUrl
              return (
              <article key={w.id} className="card card--walk appear">
                <div className="card__header">
                  <h3 className="card__title">{w.dogName}</h3>
                  <div className="card__meta">{formatDate(w.datetimeISO, lang)}</div>
                </div>
                {photo && (
                  <img src={photo} alt={w.dogName} className="card__photo" />
                )}
                <div className="card__body">
                  <div className="row">
                    <span className="badge">⏱ {w.durationMinutes} min</span>
                    <span className="badge">📏 {w.distanceKm.toFixed(1)} km</span>
                    <span className="badge">{weatherIcon(w.weather)} {t(`form.weather.${w.weather}`)}</span>
                  </div>
                  <div className="row">
                    <span className="stars" aria-label={t('form.energy')}>
                      {[1,2,3,4,5].map((n) => (
                        <span key={n} className={n <= w.energy ? 'star star--active' : 'star'}>{n <= w.energy ? '★' : '☆'}</span>
                      ))}
                    </span>
                  </div>
                  {w.notes && <p className="notes">📝 {w.notes}</p>}
                </div>
                <div className="card__actions">
                  <button type="button" className="btn" onClick={() => onEditClick(w)}>{t('history.edit')}</button>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(w.id)}>{t('history.delete')}</button>
                </div>
              </article>
            )})}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('history.prev')}</button>
            <span className="muted">{t('history.page_of').replace('{page}', String(page)).replace('{total}', String(totalPages))}</span>
            <button className="btn" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{t('history.next')}</button>
          </div>
        )}
      </div>
    </section>
  )
}