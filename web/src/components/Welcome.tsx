
import { useI18n } from '../useI18n'

export default function Welcome({ onGoLogin, onGoRegister }: { onGoLogin?: () => void; onGoRegister?: () => void }) {
  const { t } = useI18n()
  return (
    <section className="container">
      <div className="card appear" style={{ textAlign: 'center' }}>
        <h2 className="card__title">🐾 {t('app.title')}</h2>
        <p className="muted" style={{ marginTop: 8 }}>{t('auth.welcome.slogan')}</p>
        <div className="actions" style={{ marginTop: 12, justifyContent: 'center', gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={() => onGoRegister?.()}>
            {t('auth.welcome.create_account')}
          </button>
          <button type="button" className="btn" onClick={() => onGoLogin?.()}>
            {t('auth.welcome.login')}
          </button>
        </div>
      </div>
    </section>
  )
}