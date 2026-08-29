import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
const timeout = Number(import.meta.env.VITE_API_TIMEOUT || 10000)

const api = axios.create({
  baseURL,
  timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    // Add auth token here later if needed
    // const token = localStorage.getItem('token')
    // if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong while contacting the server.'

    return Promise.reject(new Error(message))
  }
)

export default api
