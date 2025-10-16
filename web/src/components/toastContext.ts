import { createContext } from 'react'

export type Toast = { id: number; message: string; type?: 'success' | 'error' | 'info' }

export type ToastContextType = {
  show: (message: string, type?: Toast['type']) => void
}

export const ToastContext = createContext<ToastContextType | null>(null)