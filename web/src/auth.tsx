// Utility and data models for authentication and app storage

export type User = {
  email: string
  name: string
  passwordHash: string
  photoDataUrl?: string
  createdAtISO: string
}

export type DogSex = 'M' | 'F'

export type DogProfile = {
  id: string
  ownerEmail: string
  name: string
  breed?: string
  weightKg?: number
  birthDateISO?: string
  sex?: DogSex
  photoDataUrl?: string
  color?: string
  notes?: string
  favorite?: boolean
  createdAtISO: string
}

// Keys
const KEY_USERS = 'dwl_users'
const KEY_CURRENT_USER = 'dwl_current_user'
const KEY_DOGS = 'dwl_dogs'
const KEY_WALKS = 'dwl_walks'

export function basicHash(password: string): string {
  try {
    return btoa(encodeURIComponent(password))
  } catch {
    return password
  }
}

export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(KEY_USERS)
    if (!raw) return []
    const list: User[] = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch { return [] }
}

export function saveUsers(list: User[]) { localStorage.setItem(KEY_USERS, JSON.stringify(list)) }

export function getCurrentUserEmail(): string | null { return localStorage.getItem(KEY_CURRENT_USER) }
export function setCurrentUserEmail(email: string | null) {
  if (!email) localStorage.removeItem(KEY_CURRENT_USER)
  else localStorage.setItem(KEY_CURRENT_USER, email)
}

export function findUserByEmail(email: string): User | null {
  const u = loadUsers().find((x) => x.email === email)
  return u || null
}

export function upsertUser(user: User): void {
  const list = loadUsers()
  const idx = list.findIndex((u) => u.email === user.email)
  if (idx >= 0) list[idx] = user
  else list.push(user)
  saveUsers(list)
}

export function loadDogs(ownerEmail?: string): DogProfile[] {
  try {
    const raw = localStorage.getItem(KEY_DOGS)
    const list: DogProfile[] = raw ? JSON.parse(raw) : []
    const arr = Array.isArray(list) ? list : []
    if (!ownerEmail) return arr
    return arr.filter((d) => d.ownerEmail === ownerEmail)
  } catch { return [] }
}

export function saveDogs(list: DogProfile[]) { localStorage.setItem(KEY_DOGS, JSON.stringify(list)) }

export function addDog(ownerEmail: string, data: Omit<DogProfile, 'id' | 'ownerEmail' | 'createdAtISO'>): DogProfile {
  const dog: DogProfile = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ownerEmail,
    name: data.name,
    breed: data.breed,
    weightKg: data.weightKg,
    birthDateISO: data.birthDateISO,
    sex: data.sex,
    photoDataUrl: data.photoDataUrl,
    color: data.color,
    notes: data.notes,
    favorite: data.favorite ?? false,
    createdAtISO: new Date().toISOString(),
  }
  const list = loadDogs()
  list.push(dog)
  // If marking as favorite, unset previous favorites
  if (dog.favorite) {
    list.forEach((d) => { if (d.ownerEmail === ownerEmail) d.favorite = d.id === dog.id })
  }
  saveDogs(list)
  return dog
}

export function updateDog(ownerEmail: string, dogId: string, patch: Partial<DogProfile>): DogProfile | null {
  const list = loadDogs()
  const next = list.map((d) => {
    if (d.id !== dogId) return d
    if (d.ownerEmail !== ownerEmail) return d
    return { ...d, ...patch }
  })
  // Handle favorite uniqueness
  const updatedDog = next.find((d) => d.id === dogId && d.ownerEmail === ownerEmail) || null
  if (updatedDog && updatedDog.favorite) {
    next.forEach((d) => { if (d.ownerEmail === ownerEmail) d.favorite = d.id === updatedDog.id })
  }
  saveDogs(next)
  return updatedDog
}

export function removeDog(ownerEmail: string, dogId: string): void {
  const list = loadDogs()
  const next = list.filter((d) => !(d.ownerEmail === ownerEmail && d.id === dogId))
  saveDogs(next)
}

// Walk scoping helpers
export type WalkEntryScoped = {
  id: string
  dogId?: string
  ownerEmail?: string
  dogName: string
  datetimeISO: string
  durationMinutes: number
  distanceKm: number
  route?: string
  weather: 'sunny' | 'cloudy' | 'rainy' | 'windy'
  energy: number
  notes?: string
  photoDataUrl?: string
  createdAtISO: string
}

export function loadWalksFor(ownerEmail?: string): WalkEntryScoped[] {
  try {
    const raw = localStorage.getItem(KEY_WALKS)
    const list: WalkEntryScoped[] = raw ? JSON.parse(raw) : []
    const arr = Array.isArray(list) ? list : []
    if (!ownerEmail) return arr
    return arr.filter((w) => w.ownerEmail === ownerEmail)
  } catch { return [] }
}

export function saveWalkFor(entry: WalkEntryScoped): void {
  const list = loadWalksFor()
  list.unshift(entry)
  localStorage.setItem(KEY_WALKS, JSON.stringify(list))
}

export function updateWalkFor(entry: WalkEntryScoped): void {
  const list = loadWalksFor()
  const next = list.map((w) => (w.id === entry.id ? { ...w, ...entry } : w))
  localStorage.setItem(KEY_WALKS, JSON.stringify(next))
}

export function deleteWalkFor(id: string): void {
  const list = loadWalksFor()
  const next = list.filter((w) => w.id !== id)
  localStorage.setItem(KEY_WALKS, JSON.stringify(next))
}

// Auth context and hooks moved to separate files to satisfy only-export-components.
// See: ./AuthProvider.tsx and ./useAuth.ts