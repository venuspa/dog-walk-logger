import { useEffect, useState } from 'react'
import { useI18n } from '../useI18n'
import { useToast } from './useToast'
import { useAuth } from '../useAuth'
import { loadDogs, addDog, updateDog, removeDog } from '../auth'
import type { DogProfile } from '../auth'

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function DogsManager() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { show } = useToast()

  const [dogs, setDogs] = useState<DogProfile[]>([])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // form state
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [weightKg, setWeightKg] = useState<number | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState<DogProfile['sex']>('M')
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [color, setColor] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!user) return
    setDogs(loadDogs(user.email))
  }, [user])

  const resetForm = () => {
    setName('')
    setBreed('')
    setWeightKg('')
    setBirthDate('')
    setSex('M')
    setPhoto(undefined)
    setColor('')
    setNotes('')
  }

  const onPickPhoto = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) { setPhoto(undefined); return }
    try { setPhoto(await toDataUrl(file)) } catch { setPhoto(undefined) }
  }

  const startAdd = () => { setAdding(true); setEditingId(null); resetForm() }
  const cancelAdd = () => { setAdding(false); resetForm() }

  const startEdit = (dog: DogProfile) => {
    setEditingId(dog.id)
    setAdding(false)
    setName(dog.name)
    setBreed(dog.breed || '')
    setWeightKg(dog.weightKg ?? '')
    setBirthDate(dog.birthDateISO ? new Date(dog.birthDateISO).toISOString().slice(0,10) : '')
    setSex(dog.sex || 'M')
    setPhoto(dog.photoDataUrl)
    setColor(dog.color || '')
    setNotes(dog.notes || '')
  }

  const submitForm = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!user) return
    if (!name.trim()) { show('⚠️ Nome do cachorro é obrigatório', 'error'); return }
    if (editingId) {
      const updated = updateDog(user.email, editingId, {
        name: name.trim(), breed: breed.trim() || undefined,
        weightKg: weightKg === '' ? undefined : Number(weightKg),
        birthDateISO: birthDate ? new Date(birthDate).toISOString() : undefined,
        sex, photoDataUrl: photo, color: color.trim() || undefined, notes: notes.trim() || undefined,
      })
      if (updated) { show('✏️ Cachorro atualizado', 'success'); setDogs(loadDogs(user.email)); setEditingId(null); resetForm() }
    } else {
      addDog(user.email, {
        name: name.trim(), breed: breed.trim() || undefined,
        weightKg: weightKg === '' ? undefined : Number(weightKg),
        birthDateISO: birthDate ? new Date(birthDate).toISOString() : undefined,
        sex, photoDataUrl: photo, color: color.trim() || undefined, notes: notes.trim() || undefined,
        favorite: dogs.length === 0, // primeiro vira favorito
      })
      show('🐶 Cachorro adicionado', 'success')
      setDogs(loadDogs(user.email))
      setAdding(false)
      resetForm()
    }
  }

  const toggleFavorite = (dog: DogProfile) => {
    if (!user) return
    updateDog(user.email, dog.id, { favorite: !dog.favorite })
    setDogs(loadDogs(user.email))
  }

  const onRemove = (dog: DogProfile) => {
    if (!user) return
    const ok = window.confirm(t('dogs.confirm_remove'))
    if (!ok) return
    removeDog(user.email, dog.id)
    show('🗑️ Cachorro removido', 'success')
    setDogs(loadDogs(user.email))
  }

  if (!user) {
    return (
      <section className="container">
        <div className="card"><p className="muted">Faça login para gerenciar cachorros.</p></div>
      </section>
    )
  }

  return (
    <section className="container">
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">🦴 {t('dogs.title')}</h2>
          <div className="actions">
            {!adding && !editingId && (
              <button className="btn btn-primary" onClick={startAdd}>{t('dogs.add_new')}</button>
            )}
          </div>
        </div>

        {(adding || editingId) && (
          <form onSubmit={submitForm} noValidate>
            <div className="grid">
              <div className="field">
                <label className="label" htmlFor="name">{t('auth.register.dog.name')} *</label>
                <input id="name" className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label className="label" htmlFor="breed">{t('auth.register.dog.breed')}</label>
                <input id="breed" className="input" type="text" value={breed} onChange={(e) => setBreed(e.target.value)} />
              </div>
            </div>
            <div className="grid">
              <div className="field">
                <label className="label" htmlFor="weight">{t('auth.register.dog.weight')}</label>
                <input id="weight" className="input" type="number" min={0} step={0.1} value={weightKg} onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <div className="field">
                <label className="label" htmlFor="birth">{t('auth.register.dog.birthdate')}</label>
                <input id="birth" className="input" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
            </div>
            <div className="grid">
              <div className="field">
                <label className="label" htmlFor="sex">{t('auth.register.dog.sex')}</label>
                <select id="sex" className="select" value={sex} onChange={(e) => setSex(e.target.value as DogProfile['sex'])}>
                  <option value="M">{t('auth.register.dog.sex.male')}</option>
                  <option value="F">{t('auth.register.dog.sex.female')}</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="color">{t('auth.register.dog.color')}</label>
                <input id="color" className="input" type="text" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="notes">{t('auth.register.dog.notes')}</label>
              <textarea id="notes" className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="photo">{t('auth.register.dog.photo')}</label>
              <input id="photo" className="input" type="file" accept="image/*" onChange={onPickPhoto} />
              {photo && <img src={photo} alt="dog" className="photo-preview" />}
            </div>
            <div className="actions" style={{ marginTop: 12 }}>
              <button type="submit" className="btn btn-primary">{editingId ? t('dogs.edit') : t('dogs.add_new')}</button>
              <button type="button" className="btn" onClick={() => { setEditingId(null); cancelAdd() }}>Cancelar</button>
            </div>
          </form>
        )}

        {dogs.length === 0 ? (
          <div className="empty"><p>{t('dogs.empty')}</p></div>
        ) : (
          <div className="cards-grid" style={{ marginTop: 12 }}>
            {dogs.map((d) => (
              <article key={d.id} className="card appear">
                <div className="card__header">
                  <h3 className="card__title">{d.name} {d.favorite ? '⭐' : ''}</h3>
                </div>
                {d.photoDataUrl && <img src={d.photoDataUrl} alt={d.name} className="card__photo" />}
                <div className="card__body">
                  <div className="row">
                    {d.breed && <span className="badge">🧬 {d.breed}</span>}
                    {typeof d.weightKg === 'number' && <span className="badge">⚖️ {d.weightKg} kg</span>}
                    {d.sex && <span className="badge">{d.sex === 'M' ? '♂️' : '♀️'}</span>}
                  </div>
                  {d.notes && <p className="notes">📝 {d.notes}</p>}
                </div>
                <div className="card__actions">
                  <button className="btn" onClick={() => startEdit(d)}>{t('dogs.edit')}</button>
                  <button className="btn" onClick={() => toggleFavorite(d)}>{t('dogs.favorite')}</button>
                  <button className="btn btn-danger" onClick={() => onRemove(d)}>{t('dogs.remove')}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}