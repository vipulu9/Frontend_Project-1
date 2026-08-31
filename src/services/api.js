import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
const timeout = Number(import.meta.env.VITE_API_TIMEOUT || 10000)

const api = axios.create({
  baseURL,
  timeout,
  // withCredentials sends HttpOnly cookies on every request — never store tokens in JS
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Called by AuthContext after mount so the interceptor can trigger logout without a circular import
let _onSessionExpired = null
export const setSessionExpiredHandler = (cb) => {
  _onSessionExpired = cb
}

// Prevent concurrent token-refresh races
let _isRefreshing = false
let _failedQueue = []

const processQueue = (error) => {
  _failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()))
  _failedQueue = []
}

const normalizeError = (error) => {
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'Something went wrong while contacting the server.'
  return new Error(message)
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Never retry the refresh endpoint itself or a request that already retried
    if (original?.url?.includes('/auth/refresh') || original?._retry) {
      if (_onSessionExpired) _onSessionExpired()
      return Promise.reject(normalizeError(error))
    }

    if (error.response?.status === 401) {
      if (_isRefreshing) {
        // Park this request until the in-flight refresh resolves
        return new Promise((resolve, reject) => {
          _failedQueue.push({ resolve, reject })
        })
          .then(() => api(original))
          .catch((err) => Promise.reject(err))
      }

      original._retry = true
      _isRefreshing = true

      try {
        // Backend rotates the access + refresh cookie pair on this endpoint
        await api.post('/auth/refresh')
        processQueue(null)
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError)
        if (_onSessionExpired) _onSessionExpired()
        return Promise.reject(normalizeError(refreshError))
      } finally {
        _isRefreshing = false
      }
    }

    return Promise.reject(normalizeError(error))
  }
)

export default api
