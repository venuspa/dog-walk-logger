import { useState } from 'react'
import { useI18n } from '../useI18n'
import { useToast } from './useToast'
import { useAuth } from '../useAuth'

export default function Login({ onSuccess, onGoRegister }: { onSuccess?: () => void; onGoRegister?: () => void }) {
  const { t } = useI18n()
  const { show } = useToast()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const canSubmit = email.trim() && password.trim()

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    setErrorMsg(null)
    const res = login(email.trim(), password)
    if (!res.ok) {
      setErrorMsg(res.error || t('auth.login.error_invalid'))
      show(res.error || t('auth.login.error_invalid'), 'error')
      return
    }
    if (remember) {
      try { localStorage.setItem('dwl_remember_email', email.trim()) } catch { /* ignore persistence errors */ }
    }
    show('✅ Login realizado', 'success')
    onSuccess?.()
  }

  return (
    <section className="container">
      <div className="card appear" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h2 className="card__title">🔐 {t('auth.login.title')}</h2>
        {errorMsg && <div className="alert alert--error" role="alert">{errorMsg}</div>}
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label className="label" htmlFor="email">{t('auth.login.email')} *</label>
            <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">{t('auth.login.password')} *</label>
            <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="row" style={{ alignItems: 'center', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> {t('auth.login.remember')}
            </label>
          </div>
          <div className="actions" style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>{t('auth.login.submit')}</button>
            <button type="button" className="btn" onClick={() => onGoRegister?.()}>{t('auth.login.no_account')}</button>
          </div>
        </form>
      </div>
    </section>
  )
}