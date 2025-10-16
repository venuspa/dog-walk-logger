import { useI18n } from '../useI18n'

export default function About() {
  const { t } = useI18n()
  return (
    <section className="container">
      <div className="card appear">
        <h2 className="card__title">ℹ️ {t('about.title')}</h2>
        <p className="muted" style={{ marginTop: 8 }}>{t('about.description')}</p>

        <article className="appear" style={{ marginTop: 12 }}>
          <h3 className="card__title">🛠️ {t('about.how.title')}</h3>
          <ul>
            <li>📝 {t('about.how.register')}</li>
            <li>📚 {t('about.how.history')}</li>
            <li>📊 {t('about.how.stats')}</li>
          </ul>
        </article>

        <article className="appear" style={{ marginTop: 12 }}>
          <h3 className="card__title">🔥 {t('about.tips.title')}</h3>
          <ul>
            <li>{t('about.tips.daily')}</li>
            <li>{t('about.tips.reminders')}</li>
            <li>{t('about.tips.notes')}</li>
          </ul>
        </article>

        <article className="appear" style={{ marginTop: 12 }}>
          <h3 className="card__title">💜 {t('about.credits.title')}</h3>
          <p>{t('about.credits.text')}</p>
        </article>
      </div>
    </section>
  )
}