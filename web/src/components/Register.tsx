import { useMemo, useState } from 'react'
import { useI18n } from '../useI18n'
import { useToast } from './useToast'
import { useAuth } from '../useAuth'
import type { DogProfile } from '../auth'

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Register({ onSuccess, onGoLogin }: { onSuccess?: () => void; onGoLogin?: () => void }) {
  const { t, lang } = useI18n()
  const { show } = useToast()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [userPhoto, setUserPhoto] = useState<string | undefined>(undefined)

  // initial dog (optional)
  const [dogName, setDogName] = useState('')
  const [breed, setBreed] = useState('')
  const [weightKg, setWeightKg] = useState<number | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState<DogProfile['sex']>('M')
  const [dogPhoto, setDogPhoto] = useState<string | undefined>(undefined)
  const [color, setColor] = useState('')
  const [notes, setNotes] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return Boolean(name.trim() && email.trim() && password.trim().length >= 6 && password === confirm)
  }, [name, email, password, confirm])

  const handleUserPhoto = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) { setUserPhoto(undefined); return }
    try { setUserPhoto(await toDataUrl(file)) } catch { setUserPhoto(undefined) }
  }

  const handleDogPhoto = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) { setDogPhoto(undefined); return }
    try { setDogPhoto(await toDataUrl(file)) } catch { setDogPhoto(undefined) }
  }

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    setErrorMsg(null)
    if (password.length < 6) {
      setErrorMsg(t('auth.register.error.password_weak'))
      return
    }
    if (password !== confirm) {
      setErrorMsg(t('auth.register.error.password_mismatch'))
      return
    }

    const initialDogData: Omit<DogProfile, 'id' | 'ownerEmail' | 'createdAtISO'> | undefined = dogName.trim()
      ? {
          name: dogName.trim(),
          breed: breed.trim() || undefined,
          weightKg: weightKg === '' ? undefined : Number(weightKg),
          birthDateISO: birthDate ? new Date(birthDate).toISOString() : undefined,
          sex,
          photoDataUrl: dogPhoto,
          color: color.trim() || undefined,
          notes: notes.trim() || undefined,
          favorite: true,
        }
      : undefined

    const res = register({ name: name.trim(), email: email.trim(), password, photoDataUrl: userPhoto }, initialDogData)
    if (!res.ok) {
      setErrorMsg(res.error || t('auth.register.error.email_exists'))
      return
    }
    show(lang === 'pt-BR' ? '🎉 Conta criada!' : '🎉 Account created!', 'success')
    onSuccess?.()
  }

  return (
    <section className="container">
      <div className="card appear" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2 className="card__title">🧑‍💻 {t('auth.register.title')}</h2>
        {errorMsg && <div className="alert alert--error" role="alert">{errorMsg}</div>}
        <form onSubmit={onSubmit} noValidate>
          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="name">{t('auth.register.user.name')} *</label>
              <input id="name" className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label className="label" htmlFor="email">{t('auth.register.user.email')} *</label>
              <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="password">{t('auth.register.user.password')} *</label>
              <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="field">
              <label className="label" htmlFor="confirm">{t('auth.register.user.confirm')} *</label>
              <input id="confirm" className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="userPhoto">{t('auth.register.user.photo')}</label>
            <input id="userPhoto" className="input" type="file" accept="image/*" onChange={handleUserPhoto} />
            {userPhoto && <img src={userPhoto} alt="user" className="photo-preview" />}
          </div>

          <hr style={{ margin: '16px 0', borderColor: 'var(--border)' }} />
          <h3 className="card__title">🐶 {t('dogs.add_new')}</h3>
          <p className="muted" style={{ marginBottom: 8 }}>{lang === 'pt-BR' ? 'Opcional: preencha para cadastrar seu primeiro cachorro.' : 'Optional: fill to add your first dog.'}</p>
          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="dogName">{t('auth.register.dog.name')}</label>
              <input id="dogName" className="input" type="text" value={dogName} onChange={(e) => setDogName(e.target.value)} />
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
            <label className="label" htmlFor="dogPhoto">{t('auth.register.dog.photo')}</label>
            <input id="dogPhoto" className="input" type="file" accept="image/*" onChange={handleDogPhoto} />
            {dogPhoto && <img src={dogPhoto} alt="dog" className="photo-preview" />}
          </div>

          <div className="actions" style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>{t('auth.register.submit')}</button>
            <button type="button" className="btn" onClick={() => onGoLogin?.()}>{t('auth.login.title')}</button>
          </div>
        </form>
      </div>
    </section>
  )
}