import axios from 'axios'

export const TOKEN_KEY = 'walks_token'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function errorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const detail = e.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((d: { loc?: string[]; msg: string }) => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join('; ')
    }
    if (!e.response) return 'Нет связи с сервером. Проверьте, что backend запущен.'
  }
  return 'Что-то пошло не так'
}
