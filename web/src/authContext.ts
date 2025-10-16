import { createContext } from 'react'
import type { User, DogProfile } from './auth'

export type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
  register: (data: { name: string; email: string; password: string; photoDataUrl?: string }, initialDog?: Omit<DogProfile, 'id' | 'ownerEmail' | 'createdAtISO'>) => { ok: boolean; error?: string }
  refresh: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)