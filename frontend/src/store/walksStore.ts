import { create } from 'zustand'
import { api, errorMessage } from '../api'
import type { Filters, Walk } from '../types'

interface WalksState {
  walks: Walk[]
  loading: boolean
  error: string | null
  fetchWalks: (filters: Filters) => Promise<void>
}

export const useWalksStore = create<WalksState>((set) => ({
  walks: [],
  loading: false,
  error: null,

  fetchWalks: async (filters) => {
    set({ loading: true, error: null })
    try {
      const params: Record<string, string> = {}
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v
      })
      const { data } = await api.get<Walk[]>('/walks', { params })
      set({ walks: data, loading: false })
    } catch (e) {
      set({ loading: false, error: errorMessage(e) })
    }
  },
}))
