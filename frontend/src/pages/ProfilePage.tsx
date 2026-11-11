import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, errorMessage } from '../api'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [city, setCity] = useState(user?.city ?? '')
  const [about, setAbout] = useState(user?.about ?? '')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg('')
    setError('')
    try {
      const { data } = await api.put<User>('/users/me', { city: city || null, about: about || null })
      setUser(data)
      setMsg('Профиль сохранён')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (!user) return null
  return (
    <form className="form narrow" onSubmit={submit}>
      <h2>Мой профиль</h2>
      <p className="muted">{user.username} · {user.email}</p>
      {msg && <p className="success">{msg}</p>}
      {error && <p className="error">{error}</p>}
      <label>Город
        <input value={city} onChange={(e) => setCity(e.target.value)} />
      </label>
      <label>О себе и интересах
        <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={5} maxLength={2000} />
      </label>
      <button className="btn">Сохранить</button>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          logout()
          navigate('/')
        }}
      >
        Выйти из аккаунта
      </button>
    </form>
  )
}
