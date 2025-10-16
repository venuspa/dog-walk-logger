import React, { useMemo, useState, useCallback } from 'react'
import type { Toast, ToastContextType } from './toastContext'
import { ToastContext } from './toastContext'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'success' ? 'toast--success' : t.type === 'error' ? 'toast--error' : 'toast--info'}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// useToast hook foi movido para './useToast' para atender a regra de Fast Refresh