import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach token ─────────────────────
api.interceptors.request.use(
  (config) => {
    // Token is set on the instance via authStore.setToken()
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 ─────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth and redirect
      localStorage.removeItem('resumeai-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
