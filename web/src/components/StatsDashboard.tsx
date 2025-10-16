import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../useI18n'
import type { WalkEntry } from './WalkForm'
import { useAuth } from '../useAuth'
import { loadDogs } from '../auth'
import type { DogProfile } from '../auth'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

type PeriodKey = 'this_week' | 'this_month' | 'last_3_months' | 'all_time'

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

function startOfWeek(d: Date) {
  const dt = new Date(d)
  const day = dt.getDay() // 0-6 (Sun-Sat)
  const diff = (day + 6) % 7 // convert to Mon=0..Sun=6
  dt.setHours(0, 0, 0, 0)
  dt.setDate(dt.getDate() - diff)
  return dt
}

function startOfMonth(d: Date) {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  dt.setDate(1)
  return dt
}

function addDays(d: Date, n: number) {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + n)
  return dt
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getPeriodRange(period: PeriodKey): { start: Date | null; end: Date } {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  if (period === 'this_week') {
    return { start: startOfWeek(now), end }
  }
  if (period === 'this_month') {
    return { start: startOfMonth(now), end }
  }
  if (period === 'last_3_months') {
    const start = new Date(now)
    start.setMonth(start.getMonth() - 3)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  return { start: null, end }
}

function filterByPeriod(walks: WalkEntry[], period: PeriodKey): WalkEntry[] {
  const { start, end } = getPeriodRange(period)
  return walks.filter((w) => {
    const dt = new Date(w.datetimeISO)
    if (start && dt < start) return false
    if (dt > end) return false
    return true
  })
}

function sum<T>(arr: T[], fn: (t: T) => number): number { return arr.reduce((acc, t) => acc + fn(t), 0) }

function formatKm(n: number) { return `${n.toFixed(1)} km` }
function formatMin(n: number) { return `${Math.round(n)} min` }
function formatHoursFromMinutes(min: number) { return `${(min / 60).toFixed(1)} h` }

function weekdayIndex(d: Date) {
  // map to Mon=0..Sun=6
  return (d.getDay() + 6) % 7
}

function computeWeekdayCounts(walks: WalkEntry[]): number[] {
  const counts = Array(7).fill(0)
  walks.forEach((w) => { counts[weekdayIndex(new Date(w.datetimeISO))]++ })
  return counts
}

function startOfWeekForDate(d: Date) {
  return startOfWeek(d)
}

function labelForWeekRange(start: Date, lang: 'en' | 'pt-BR') {
  const end = addDays(start, 6)
  const fmt = (x: Date) => `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth()+1).padStart(2, '0')}`
  return lang === 'pt-BR' ? `${fmt(start)}–${fmt(end)}` : `${fmt(start)}–${fmt(end)}`
}

function computeDistanceByWeek(walks: WalkEntry[], lang: 'en' | 'pt-BR') {
  // last 4 weeks, ending this week
  const now = new Date()
  const thisWeekStart = startOfWeekForDate(now)
  const weeks: { start: Date; label: string; totalKm: number }[] = []
  for (let i = 3; i >= 0; i--) {
    const start = addDays(thisWeekStart, -7 * i)
    const end = addDays(start, 7)
    const label = labelForWeekRange(start, lang)
    const totalKm = sum(walks, (w) => {
      const dt = new Date(w.datetimeISO)
      return dt >= start && dt < end ? w.distanceKm : 0
    })
    weeks.push({ start, label, totalKm })
  }
  return weeks
}

function computeWeatherDistribution(walks: WalkEntry[]) {
  const keys: Array<WalkEntry['weather']> = ['sunny', 'cloudy', 'rainy', 'windy']
  const counts = keys.map((k) => walks.filter((w) => w.weather === k).length)
  return { keys, counts }
}

function computeStreaks(walks: WalkEntry[]) {
  const byDay = new Map<string, number>()
  walks.forEach((w) => {
    const d = new Date(w.datetimeISO)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    byDay.set(key, (byDay.get(key) ?? 0) + 1)
  })

  // current streak ending today
  let current = 0
  let best = 0
  const today = new Date()
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  while (true) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`
    if (byDay.has(key)) {
      current++
      cursor = addDays(cursor, -1)
    } else {
      break
    }
  }

  // best streak
  const allDays = Array.from(byDay.keys()).map((k) => new Date(k))
  allDays.sort((a, b) => +a - +b)
  let run = 0
  for (let i = 0; i < allDays.length; i++) {
    if (i === 0 || isSameDay(allDays[i], addDays(allDays[i-1], 1))) {
      run++
      best = Math.max(best, run)
    } else {
      run = 1
      best = Math.max(best, run)
    }
  }

  return { current, best }
}

function computeRankingDays(walks: WalkEntry[]) {
  const map = new Map<string, { count: number; distanceKm: number; date: Date }>()
  walks.forEach((w) => {
    const d = new Date(w.datetimeISO)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const cur = map.get(key) || { count: 0, distanceKm: 0, date: d }
    cur.count += 1
    cur.distanceKm += w.distanceKm
    map.set(key, cur)
  })

  const arr = Array.from(map.values())
  arr.sort((a, b) => (b.count - a.count) || (b.distanceKm - a.distanceKm))
  return arr.slice(0, 5)
}

function formatDate(d: Date, lang: 'en' | 'pt-BR') {
  try {
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }
    return new Intl.DateTimeFormat(lang === 'pt-BR' ? 'pt-BR' : 'en-US', opts).format(d)
  } catch {
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`
  }
}

export default function StatsDashboard({ onGoRegister }: { onGoRegister?: () => void }) {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [allWalks, setAllWalks] = useState<WalkEntry[]>([])
  const [period, setPeriod] = useState<PeriodKey>('this_month')
  const [loading, setLoading] = useState<boolean>(true)
  const [dogs, setDogs] = useState<DogProfile[]>([])
  const [dogFilterId, setDogFilterId] = useState<string>('')

  useEffect(() => { setAllWalks(loadWalks()) }, [])

  // Carrega cachorros do usuário logado e pré-seleciona favorito
  useEffect(() => {
    if (user?.email) {
      const list = loadDogs(user.email)
      setDogs(list)
      const fav = list.find((d) => d.favorite)
      setDogFilterId(fav?.id ?? '')
    } else {
      setDogs([])
      setDogFilterId('')
    }
  }, [user?.email])

  useEffect(() => {
    setLoading(true)
    const id = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(id)
  }, [period, allWalks.length])

  // Escopo por usuário
  const scopedWalks = useMemo(() => {
    if (!user?.email) return allWalks
    return allWalks.filter((w) => w.ownerEmail === user.email)
  }, [allWalks, user?.email])

  // Filtro por cachorro (por id preferencialmente, com fallback por nome)
  const dogScopedWalks = useMemo(() => {
    if (!dogFilterId) return scopedWalks
    const selectedDog = dogs.find((d) => d.id === dogFilterId)
    return scopedWalks.filter((w) => {
      if (w.dogId) return w.dogId === dogFilterId
      if (selectedDog) return w.dogName === selectedDog.name
      return false
    })
  }, [scopedWalks, dogFilterId, dogs])

  const filtered = useMemo(() => filterByPeriod(dogScopedWalks, period), [dogScopedWalks, period])

  const totalWalksFiltered = filtered.length
  const totalDistanceFiltered = useMemo(() => sum(filtered, (w) => w.distanceKm), [filtered])
  const totalMinutesFiltered = useMemo(() => sum(filtered, (w) => w.durationMinutes), [filtered])
  const avgDurationMin = useMemo(() => totalWalksFiltered ? (totalMinutesFiltered / totalWalksFiltered) : 0, [totalMinutesFiltered, totalWalksFiltered])
  const longest = useMemo(() => filtered.slice().sort((a, b) => b.durationMinutes - a.durationMinutes)[0] || null, [filtered])
  const mostActiveDog = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((w) => {
      const key = w.dogId || w.dogName
      if (!key) return
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    let bestKey: string | null = null
    let bestCount = 0
    map.forEach((count, key) => { if (count > bestCount) { bestCount = count; bestKey = key } })
    if (!bestKey) return null
    const byId = dogs.find((d) => d.id === bestKey)
    const byName = byId ? undefined : dogs.find((d) => d.name === bestKey)
    const name: string = byId?.name ?? byName?.name ?? bestKey
    const photo: string | undefined = byId?.photoDataUrl ?? byName?.photoDataUrl
    return { name, count: bestCount, photo }
  }, [filtered, dogs])

  const countsThisWeek = useMemo(() => filterByPeriod(scopedWalks, 'this_week').length, [scopedWalks])
  const countsThisMonth = useMemo(() => filterByPeriod(scopedWalks, 'this_month').length, [scopedWalks])
  const countsAllTime = scopedWalks.length

  const streaks = useMemo(() => computeStreaks(scopedWalks), [scopedWalks])

  const weekdayCounts = useMemo(() => computeWeekdayCounts(filtered), [filtered])
  const weekdayLabels = useMemo(() => [
    t('stats.weekday.mon'), t('stats.weekday.tue'), t('stats.weekday.wed'), t('stats.weekday.thu'), t('stats.weekday.fri'), t('stats.weekday.sat'), t('stats.weekday.sun')
  ], [lang, t])

  const weeksDistance = useMemo(() => computeDistanceByWeek(filtered, lang), [filtered, lang])
  const weeksTime = useMemo(() => {
    // Similar to distance, sumariza minutos -> horas por semana (últimas 4)
    const now = new Date()
    const thisWeekStart = startOfWeekForDate(now)
    const res: { label: string; totalHours: number }[] = []
    for (let i = 3; i >= 0; i--) {
      const start = addDays(thisWeekStart, -7 * i)
      const end = addDays(start, 7)
      const label = labelForWeekRange(start, lang)
      const totalMin = sum(filtered, (w) => {
        const dt = new Date(w.datetimeISO)
        return dt >= start && dt < end ? w.durationMinutes : 0
      })
      res.push({ label, totalHours: Number((totalMin / 60).toFixed(1)) })
    }
    return res
  }, [filtered, lang])
  const weatherDist = useMemo(() => computeWeatherDistribution(filtered), [filtered])

  const hasEnoughData = scopedWalks.length >= 1

  const primary = '#2e7d32'
  const accent = '#ff8f00'
  const palette = ['#2e7d32', '#ff8f00', '#3b82f6', '#ef4444']

  return (
    <section className="container">
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">{t('stats.title')} 📊</h2>
          <div className="field" style={{ minWidth: 200 }}>
            <label className="label" htmlFor="period">{t('stats.filter.period')}</label>
            <select id="period" className="select" value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)}>
              <option value="this_week">{t('stats.period.this_week')}</option>
              <option value="this_month">{t('stats.period.this_month')}</option>
              <option value="last_3_months">{t('stats.period.last_3_months')}</option>
              <option value="all_time">{t('stats.period.all_time')}</option>
            </select>
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <label className="label" htmlFor="dogFilter">{t('form.dog.select')}</label>
            <select id="dogFilter" className="select" value={dogFilterId} onChange={(e) => setDogFilterId(e.target.value)}>
              <option value="">{t('history.filter.any')}</option>
              {dogs.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty"><div className="spinner" aria-busy="true">{t('stats.filter.period')}…</div></div>
        ) : !hasEnoughData ? (
          <div className="empty">
            <p>{t('stats.empty.title')}</p>
            <div className="actions">
              <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); onGoRegister?.() }}>{t('stats.empty.cta')}</a>
            </div>
          </div>
        ) : (
          <>
            {/* Metric cards */}
            <div className="cards-grid" style={{ marginTop: 8 }}>
              <article className="card appear">
                <h3 className="card__title">🔢 {t('stats.metrics.total_walks')}</h3>
                <div className="row">
                  <span className="badge">{t('stats.metrics.this_week')}: {countsThisWeek}</span>
                  <span className="badge">{t('stats.metrics.this_month')}: {countsThisMonth}</span>
                  <span className="badge">{t('stats.metrics.all_time')}: {countsAllTime}</span>
                </div>
              </article>
              <article className="card appear">
                <h3 className="card__title">📏 {t('stats.metrics.total_distance')}</h3>
                <p className="muted">{t('stats.filter.period')}: {t(`stats.period.${period}`)}</p>
                <div className="row"><span className="badge">{formatKm(totalDistanceFiltered)}</span></div>
              </article>
              <article className="card appear">
                <h3 className="card__title">⏱ {t('stats.metrics.total_time')}</h3>
                <p className="muted">{t('stats.filter.period')}: {t(`stats.period.${period}`)}</p>
                <div className="row"><span className="badge">{formatHoursFromMinutes(totalMinutesFiltered)}</span></div>
              </article>
              <article className="card appear">
                <h3 className="card__title">⌚ {t('stats.metrics.avg_duration')}</h3>
                <p className="muted">{t('stats.filter.period')}: {t(`stats.period.${period}`)}</p>
                <div className="row"><span className="badge">{formatMin(avgDurationMin)}</span></div>
              </article>
              <article className="card appear">
                <h3 className="card__title">🏅 {t('stats.metrics.longest_walk')}</h3>
                {longest ? (
                  <div className="row">
                    <span className="badge">⏱ {longest.durationMinutes} min</span>
                    <span className="badge">📏 {formatKm(longest.distanceKm)}</span>
                    <span className="badge">🐶 {longest.dogName}</span>
                  </div>
                ) : (
                  <p className="muted">—</p>
                )}
              </article>
              <article className="card appear">
                <h3 className="card__title">🐕 {t('stats.metrics.most_active_dog')}</h3>
                {mostActiveDog ? (
                  <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                    {mostActiveDog.photo && (
                      <img src={mostActiveDog.photo} alt={mostActiveDog.name} style={{ width: 32, height: 32, borderRadius: 16, objectFit: 'cover', border: '1px solid var(--border)' }} />
                    )}
                    <span className="badge">{mostActiveDog.name}</span>
                    <span className="badge">🐾 {mostActiveDog.count} {t('stats.ranking.headers.count')}</span>
                  </div>
                ) : (
                  <p className="muted">—</p>
                )}
              </article>
            </div>

            {/* Streak */}
            <article className="card appear" style={{ marginTop: 12 }}>
              <h3 className="card__title">🔥 {t('stats.streak.title')}</h3>
              <div className="row">
                <span className="badge">🏆 {t('stats.streak.current')}: {streaks.current} {lang === 'pt-BR' ? 'dias' : 'days'}</span>
                <span className="badge">🥇 {t('stats.streak.best')}: {streaks.best} {lang === 'pt-BR' ? 'dias' : 'days'}</span>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>
                {streaks.current > 0 ? t('stats.streak.message.active').replace('{days}', String(streaks.current)) : t('stats.streak.message.zero')}
              </p>
            </article>

            {/* Charts */}
            <div className="cards-grid" style={{ marginTop: 12 }}>
              <article className="card appear">
                <h3 className="card__title">📈 {t('stats.graphs.walks_by_weekday.title')}</h3>
                <div className="chart" style={{ height: 260 }}>
                  <Line
                    data={{
                      labels: weekdayLabels,
                      datasets: [{ label: t('stats.metrics.total_walks'), data: weekdayCounts, borderColor: primary, backgroundColor: primary }],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, animation: { duration: 400 } }}
                  />
                </div>
              </article>
              <article className="card appear">
                <h3 className="card__title">📊 {t('stats.graphs.distance_by_week.title')}</h3>
                <div className="chart" style={{ height: 260 }}>
                  <Bar
                    data={{
                      labels: weeksDistance.map((w) => w.label),
                      datasets: [{ label: t('stats.metrics.total_distance'), data: weeksDistance.map((w) => Number(w.totalKm.toFixed(1))), backgroundColor: accent }],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, animation: { duration: 400 } }}
                  />
                </div>
              </article>
              <article className="card appear">
                <h3 className="card__title">🥧 {t('stats.graphs.weather_distribution.title')}</h3>
                <div className="chart" style={{ height: 260 }}>
                  <Pie
                    data={{
                      labels: weatherDist.keys.map((k) => `${k === 'sunny' ? '☀️' : k === 'cloudy' ? '☁️' : k === 'rainy' ? '🌧️' : '🌬️'} ${t(`form.weather.${k}`)}`),
                      datasets: [{ data: weatherDist.counts, backgroundColor: palette }],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, animation: { duration: 400 } }}
                  />
                </div>
              </article>
              <article className="card appear">
                <h3 className="card__title">🕒 {t('stats.graphs.time_by_week.title')}</h3>
                <div className="chart" style={{ height: 260 }}>
                  <Bar
                    data={{
                      labels: weeksTime.map((w) => w.label),
                      datasets: [{ label: `${t('stats.metrics.total_time')} (h)`, data: weeksTime.map((w) => w.totalHours), backgroundColor: '#3b82f6' }],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, animation: { duration: 400 } }}
                  />
                </div>
              </article>
            </div>

            {/* Ranking */}
            <article className="card appear" style={{ marginTop: 12 }}>
              <h3 className="card__title">🏆 {t('stats.ranking.title')}</h3>
              <div className="row" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--border)' }}>{t('stats.ranking.headers.date')}</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--border)' }}>{t('stats.ranking.headers.count')}</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--border)' }}>{t('stats.ranking.headers.distance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                {computeRankingDays(filtered).map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{formatDate(row.date, lang)}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.count}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{formatKm(row.distanceKm)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            {/* Achievements */}
            <article className="card appear" style={{ marginTop: 12 }}>
              <h3 className="card__title">🎖️ {t('stats.achievements.title')}</h3>
              <div className="row">
                <span className="badge">🥉 {t('stats.achievements.bronze')}</span>
                <span className="badge">🥈 {t('stats.achievements.silver')}</span>
                <span className="badge">🥇 {t('stats.achievements.gold')}</span>
                <span className="badge">🏆 {t('stats.achievements.platinum')}</span>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>
                {(() => {
                  const milestones = [10, 50, 100, 365]
                  const next = milestones.find((m) => countsAllTime < m)
                  if (!next) return `${t('stats.achievements.progress_to_next')}: 100%`
                  const pct = Math.min(100, Math.round((countsAllTime / next) * 100))
                  return `${t('stats.achievements.progress_to_next')}: ${pct}% (${countsAllTime}/${next})`
                })()}
              </p>
            </article>
          </>
        )}
      </div>
    </section>
  )
}