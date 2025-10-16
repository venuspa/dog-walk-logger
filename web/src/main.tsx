import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n'
import { ToastProvider } from './components/Toast'
import { AuthProvider } from './AuthProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
