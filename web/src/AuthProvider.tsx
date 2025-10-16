import React, { useEffect, useMemo, useState } from 'react'
import { AuthContext, type AuthContextType } from './authContext'
import { basicHash, loadUsers, setCurrentUserEmail, findUserByEmail, getCurrentUserEmail, saveUsers, addDog, type User } from './auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const email = getCurrentUserEmail()
    if (email) setUser(findUserByEmail(email))
    else setUser(null)
  }, [])

  const login = (email: string, password: string) => {
    const users = loadUsers()
    const u = users.find((x) => x.email === email)
    if (!u) return { ok: false, error: 'Usuário não encontrado' }
    if (u.passwordHash !== basicHash(password)) return { ok: false, error: 'Credenciais inválidas' }
    setCurrentUserEmail(u.email)
    setUser(u)
    return { ok: true }
  }

  const logout = () => {
    setCurrentUserEmail(null)
    setUser(null)
  }

  const register: AuthContextType['register'] = (data, initialDog) => {
    const users = loadUsers()
    const exists = users.some((x) => x.email === data.email)
    if (exists) return { ok: false, error: 'Email já cadastrado' }
    const u: User = {
      email: data.email,
      name: data.name,
      passwordHash: basicHash(data.password),
      photoDataUrl: data.photoDataUrl,
      createdAtISO: new Date().toISOString(),
    }
    users.push(u)
    saveUsers(users)

    if (initialDog) {
      addDog(u.email, { ...initialDog, favorite: initialDog.favorite ?? true })
    }

    setCurrentUserEmail(u.email)
    setUser(u)
    return { ok: true }
  }

  const refresh = () => {
    const email = getCurrentUserEmail()
    setUser(email ? findUserByEmail(email) : null)
  }

  const value = useMemo(() => ({ user, login, logout, register, refresh }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}