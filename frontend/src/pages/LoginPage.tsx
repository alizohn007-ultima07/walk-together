import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const doLogin = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await doLogin(login, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form narrow" onSubmit={submit}>
      <h2>Вход</h2>
      {error && <p className="error">{error}</p>}
      <label>Логин или email
        <input value={login} onChange={(e) => setLogin(e.target.value)} required autoFocus />
      </label>
      <label>Пароль
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      <button className="btn" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
      <p className="muted">Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
    </form>
  )
}
