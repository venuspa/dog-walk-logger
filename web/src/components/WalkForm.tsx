import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../useI18n'
import { useToast } from './useToast'
import { useAuth } from '../useAuth'
import { loadDogs } from '../auth'
import type { DogProfile } from '../auth'

type Weather = 'sunny' | 'cloudy' | 'rainy' | 'windy'

export type WalkEntry = {
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

function saveWalk(entry: WalkEntry) {
  const key = 'dwl_walks'
  const list: WalkEntry[] = JSON.parse(localStorage.getItem(key) || '[]')
  list.unshift(entry)
  localStorage.setItem(key, JSON.stringify(list))
}

function updateWalk(entry: WalkEntry) {
  const key = 'dwl_walks'
  const list: WalkEntry[] = JSON.parse(localStorage.getItem(key) || '[]')
  const next = list.map((w) => (w.id === entry.id ? { ...w, ...entry } : w))
  localStorage.setItem(key, JSON.stringify(next))
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function WalkForm({ initialEntry, onSaved, onCancel, onDirtyChange }: { initialEntry?: WalkEntry | null, onSaved?: (entry: WalkEntry) => void, onCancel?: () => void, onDirtyChange?: (dirty: boolean) => void }) {
  const { t } = useI18n()
  const { show } = useToast()
  const { user } = useAuth()
  const [dogName, setDogName] = useState('')
  const [selectedDogId, setSelectedDogId] = useState<string | ''>('')
  const [dogs, setDogs] = useState<DogProfile[]>([])
  const [walkDatetime, setWalkDatetime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('')
  const [distanceKm, setDistanceKm] = useState<number | ''>('')
  const [route, setRoute] = useState('')
  const [weather, setWeather] = useState<Weather | ''>('')
  const [energy, setEnergy] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isEdit = useMemo(() => Boolean(initialEntry?.id), [initialEntry])
  const canSubmit = useMemo(() => {
    return Boolean(
      dogName.trim() &&
      walkDatetime &&
      durationMinutes !== '' && Number(durationMinutes) > 0 &&
      weather &&
      energy !== '' && Number(energy) >= 1
    )
  }, [dogName, walkDatetime, durationMinutes, weather, energy])

  useEffect(() => {
    if (!initialEntry) return
    setDogName(initialEntry.dogName)
    if (initialEntry.dogId) setSelectedDogId(initialEntry.dogId)
    setWalkDatetime(toDatetimeLocal(initialEntry.datetimeISO))
    setDurationMinutes(initialEntry.durationMinutes)
    setDistanceKm(initialEntry.distanceKm)
    setRoute(initialEntry.route ?? '')
    setWeather(initialEntry.weather)
    setEnergy(initialEntry.energy)
    setNotes(initialEntry.notes ?? '')
    setPhotoDataUrl(initialEntry.photoDataUrl)
  }, [initialEntry])

  // carregar cachorros do usuário e selecionar favorito
  useEffect(() => {
    if (!user) { setDogs([]); setSelectedDogId(''); return }
    const list = loadDogs(user.email)
    setDogs(list)
    if (!initialEntry) {
      const fav = list.find((d) => d.favorite)
      const first = fav ?? list[0]
      if (first) {
        setSelectedDogId(first.id)
        setDogName(first.name)
      }
    }
  }, [user, initialEntry])

  // dirty tracking
  const isDirty = useMemo(() => {
    const init = initialEntry
    if (init) {
      return (
        dogName !== init.dogName ||
        toDatetimeLocal(init.datetimeISO) !== walkDatetime ||
        durationMinutes !== init.durationMinutes ||
        distanceKm !== init.distanceKm ||
        route !== (init.route ?? '') ||
        weather !== init.weather ||
        energy !== init.energy ||
        notes !== (init.notes ?? '') ||
        photoDataUrl !== init.photoDataUrl
      )
    }
    return !!(dogName || walkDatetime || durationMinutes || distanceKm || route || weather || energy || notes || photoDataUrl)
  }, [initialEntry, dogName, walkDatetime, durationMinutes, distanceKm, route, weather, energy, notes, photoDataUrl])

  useEffect(() => { onDirtyChange?.(isDirty) }, [isDirty, onDirtyChange])
  useEffect(() => {
    const handler = (ev: BeforeUnloadEvent) => {
      if (!isDirty) return
      ev.preventDefault()
      ev.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const validate = () => {
    const e: Record<string, string> = {}
    if (dogs.length > 0) {
      if (!selectedDogId) e.dogName = t('form.required')
    } else {
      if (!dogName.trim()) e.dogName = t('form.required')
    }
    if (!walkDatetime) e.walkDatetime = t('form.required')
    if (durationMinutes === '' || (durationMinutes as number) <= 0) e.durationMinutes = t('form.validation.duration_positive')
    if (distanceKm === '' || (distanceKm as number) < 0) e.distanceKm = t('form.validation.distance_nonnegative')
    if (!weather) e.weather = t('form.required')
    if (energy === '' || (energy as number) < 1) e.energy = t('form.validation.energy_required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSuccessMsg(null)
    if (!validate()) return

    const entry: WalkEntry = {
      id: isEdit ? initialEntry!.id : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ownerEmail: user?.email,
      dogId: selectedDogId || undefined,
      dogName: dogName.trim(),
      datetimeISO: new Date(walkDatetime).toISOString(),
      durationMinutes: Number(durationMinutes),
      distanceKm: Number(distanceKm),
      route: route.trim() || undefined,
      weather: weather as Weather,
      energy: Number(energy),
      notes: notes.trim() || undefined,
      photoDataUrl,
      createdAtISO: isEdit ? (initialEntry!.createdAtISO || new Date().toISOString()) : new Date().toISOString(),
    }

    if (isEdit) {
      updateWalk(entry)
      setSuccessMsg(t('form.updated'))
      show(t('toast.updated'), 'success')
    } else {
      saveWalk(entry)
      setSuccessMsg(t('form.success'))
      show(t('toast.saved'), 'success')
    }

    onSaved?.(entry)

    // Reset
    setDogName('')
    setWalkDatetime('')
    setDurationMinutes('')
    setDistanceKm('')
    setRoute('')
    setWeather('')
    setEnergy('')
    setNotes('')
    setPhotoDataUrl(undefined)
    setErrors({})
    onDirtyChange?.(false)
  }

  const handlePhotoChange = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) {
      setPhotoDataUrl(undefined)
      return
    }
    try {
      const url = await toDataUrl(file)
      setPhotoDataUrl(url)
    } catch {
      setPhotoDataUrl(undefined)
      setErrors((prev) => ({ ...prev, photo: t('form.error.upload_failed') }))
    }
  }

  return (
    <section className="container">
      <div className="card appear">
        <h2 className="card__title">{isEdit ? t('form.title_edit') : t('form.title')} 🐶</h2>
        {successMsg && (
          <div className="alert alert--success" role="status" aria-live="polite">
            <span className="success-check__icon">✓</span> {successMsg}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="dogName" className="label">{dogs.length > 0 ? t('form.dog.select') : t('form.dogName')} *</label>
            {dogs.length > 0 ? (
              <select
                id="dogName"
                className="select"
                value={selectedDogId}
                onChange={(e) => {
                  const id = e.target.value
                  setSelectedDogId(id)
                  const d = dogs.find((x) => x.id === id)
                  setDogName(d?.name ?? '')
                }}
                aria-invalid={Boolean(errors.dogName)}
                aria-required="true"
              >
                <option value="">—</option>
                {dogs.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            ) : (
              <input
                id="dogName"
                className="input"
                type="text"
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                aria-invalid={Boolean(errors.dogName)}
                aria-required="true"
              />
            )}
            {errors.dogName && <p className="error" role="alert">{errors.dogName}</p>}
          </div>

          <div className="field">
            <label htmlFor="walkDatetime" className="label">{t('form.walkDatetime')} *</label>
            <input
              id="walkDatetime"
              className="input"
              type="datetime-local"
              value={walkDatetime}
              onChange={(e) => setWalkDatetime(e.target.value)}
              aria-invalid={Boolean(errors.walkDatetime)}
              aria-required="true"
            />
            {errors.walkDatetime && <p className="error" role="alert">{errors.walkDatetime}</p>}
          </div>

          <div className="grid">
            <div className="field">
              <label htmlFor="duration" className="label">{t('form.duration')} *</label>
              <input
                id="duration"
                className="input"
                type="number"
                min={1}
                step={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                aria-invalid={Boolean(errors.durationMinutes)}
                aria-required="true"
              />
              {errors.durationMinutes && <p className="error" role="alert">{errors.durationMinutes}</p>}
            </div>

            <div className="field">
              <label htmlFor="distance" className="label">{t('form.distance')}</label>
              <input
                id="distance"
                className="input"
                type="number"
                min={0}
                step={0.1}
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))}
                aria-invalid={Boolean(errors.distanceKm)}
              />
              {errors.distanceKm && <p className="error" role="alert">{errors.distanceKm}</p>}
            </div>
          </div>

          <div className="grid">
            <div className="field">
              <label htmlFor="route" className="label">{t('form.route')}</label>
              <input
                id="route"
                className="input"
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="weather" className="label">{t('form.weather')} *</label>
              <select
                id="weather"
                className="select"
                value={weather}
                onChange={(e) => setWeather(e.target.value as Weather)}
                aria-invalid={Boolean(errors.weather)}
                aria-required="true"
              >
                <option value="">—</option>
                <option value="sunny">{t('form.weather.sunny')} ☀️</option>
                <option value="cloudy">{t('form.weather.cloudy')} ☁️</option>
                <option value="rainy">{t('form.weather.rainy')} 🌧️</option>
                <option value="windy">{t('form.weather.windy')} 🌬️</option>
              </select>
              {errors.weather && <p className="error" role="alert">{errors.weather}</p>}
            </div>
          </div>

          <div className="field">
            <span className="label">{t('form.energy')} *</span>
            <div className="stars" role="radiogroup" aria-label={t('form.energy')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`star ${Number(energy) >= n ? 'star--active' : ''}`}
                  aria-checked={Number(energy) === n}
                  onClick={() => setEnergy(n)}
                >
                  {Number(energy) >= n ? '★' : '☆'}
                </button>
              ))}
            </div>
            <p className="help">{t('form.energy.help')}</p>
            {errors.energy && <p className="error" role="alert">{errors.energy}</p>}
          </div>

          <div className="field">
            <label htmlFor="notes" className="label">{t('form.notes')}</label>
            <textarea
              id="notes"
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="field">
            <label htmlFor="photo" className="label">{t('form.photo')}</label>
            <input
              id="photo"
              className="input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            {photoDataUrl && (
              <img src={photoDataUrl} alt="preview" className="photo-preview" />
            )}
            {errors.photo && <p className="error" role="alert">{errors.photo}</p>}
          </div>

          <div className="actions">
            {onCancel && (
              <button type="button" className="btn" onClick={() => onCancel()}>{t('form.cancel')}</button>
            )}
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>{isEdit ? t('form.update') : t('form.submit')}</button>
          </div>
        </form>
      </div>
    </section>
  )
}

function toDatetimeLocal(iso: string) {
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const min = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
  } catch {
    return ''
  }
}