import { create } from 'zustand'
import { api, TOKEN_KEY } from '../api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  ready: boolean
  init: () => Promise<void>
  login: (login: string, password: string) => Promise<void>
  register: (data: { username: string; email: string; password: string; city?: string }) => Promise<void>
  logout: () => void
  setUser: (u: User) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  ready: false,

  init: async () => {
    if (!get().token) {
      set({ ready: true })
      return
    }
    try {
      const { data } = await api.get<User>('/auth/me')
      set({ user: data, ready: true })
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      set({ user: null, token: null, ready: true })
    }
  },

  login: async (login, password) => {
    const { data } = await api.post<{ access_token: string }>('/auth/login', { login, password })
    localStorage.setItem(TOKEN_KEY, data.access_token)
    set({ token: data.access_token })
    const me = await api.get<User>('/auth/me')
    set({ user: me.data })
  },

  register: async (payload) => {
    const { data } = await api.post<{ access_token: string }>('/auth/register', payload)
    localStorage.setItem(TOKEN_KEY, data.access_token)
    set({ token: data.access_token })
    const me = await api.get<User>('/auth/me')
    set({ user: me.data })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, token: null })
  },

  setUser: (u) => set({ user: u }),
}))
