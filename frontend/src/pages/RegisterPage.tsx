import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api'
import { useAuthStore } from '../store/authStore'

export default function RegisterPage() {
  const [f, setF] = useState({ username: '', email: '', password: '', city: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await register({ ...f, city: f.city || undefined })
      navigate('/')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form narrow" onSubmit={submit}>
      <h2>Регистрация</h2>
      {error && <p className="error">{error}</p>}
      <label>Логин (от 3 символов)
        <input value={f.username} onChange={set('username')} minLength={3} required />
      </label>
      <label>Email
        <input type="email" value={f.email} onChange={set('email')} required />
      </label>
      <label>Пароль (от 6 символов)
        <input type="password" value={f.password} onChange={set('password')} minLength={6} required />
      </label>
      <label>Город
        <input value={f.city} onChange={set('city')} />
      </label>
      <button className="btn" disabled={busy}>{busy ? 'Создаём…' : 'Создать аккаунт'}</button>
      <p className="muted">Уже есть аккаунт? <Link to="/login">Войти</Link></p>
    </form>
  )
}
