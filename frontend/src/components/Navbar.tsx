import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">🚶 Прогулки вместе</Link>
        <nav className="nav-links">
          <NavLink to="/" end>Прогулки</NavLink>
          {user ? (
            <>
              <NavLink to="/walks/new">Создать</NavLink>
              <NavLink to="/my">Мои прогулки</NavLink>
              <NavLink to="/profile">{user.username}</NavLink>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Вход</NavLink>
              <Link to="/register" className="btn">Регистрация</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
