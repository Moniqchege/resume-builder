import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@lib/api'

export interface User {
  id: string
  name: string
  email: string
  image?: string
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  provider: 'microsoft'
}

interface AuthState {
  user:      User | null
  token:     string | null
  isLoading: boolean
  login:     (provider: string) => void
  logout:    () => Promise<void>
  fetchMe:   () => Promise<void>
  setToken:  (token: string, user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:      null,
      token:     null,
      isLoading: false,

      login(provider: string) {
        // Redirect to backend OAuth flow
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/${provider}`
      },

      async logout() {
        try {
          await api.post('/api/auth/logout')
        } catch (_) { /* ignore */ }
        set({ user: null, token: null })
        window.location.href = '/login'
      },

      async fetchMe() {
        const { token } = get()
        if (!token) return
        set({ isLoading: true })
        try {
          const { data } = await api.get('/api/auth/me')
          set({ user: data.user, isLoading: false })
        } catch (_) {
          set({ user: null, token: null, isLoading: false })
        }
      },

      setToken(token, user) {
        set({ token, user })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
    }),
    {
      name: 'resumeai-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
