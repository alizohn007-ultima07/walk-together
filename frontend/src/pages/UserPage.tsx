import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, errorMessage } from '../api'
import WalkCard from '../components/WalkCard'
import { useAuthStore } from '../store/authStore'
import type { UserPublic, Walk } from '../types'

export default function UserPage() {
  const { id } = useParams()
  const me = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const [profile, setProfile] = useState<UserPublic | null>(null)
  const [walks, setWalks] = useState<Walk[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [u, w] = await Promise.all([
        api.get<UserPublic>(`/users/${id}`),
        api.get<Walk[]>('/walks', { params: { organizer_id: id } }),
      ])
      setProfile(u.data)
      setWalks(w.data)
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load, token])

  const toggle = async () => {
    if (!profile) return
    try {
      if (profile.is_subscribed) await api.delete(`/users/${profile.id}/subscribe`)
      else await api.post(`/users/${profile.id}/subscribe`)
      await load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  if (error && !profile) return <p className="error">{error}</p>
  if (!profile) return <p className="muted">Загрузка…</p>

  return (
    <>
      <div className="panel">
        <h1>👤 {profile.username}</h1>
        <p className="muted">
          {profile.city ? `${profile.city} · ` : ''}Прогулок создано: {profile.walks_count} · Подписчиков: {profile.followers_count}
        </p>
        {profile.about && <p>{profile.about}</p>}
        {error && <p className="error">{error}</p>}
        {me && me.id !== profile.id && (
          <button className={profile.is_subscribed ? 'btn btn-ghost' : 'btn'} onClick={toggle}>
            {profile.is_subscribed ? 'Отписаться' : 'Подписаться'}
          </button>
        )}
        {!me && (
          <p className="notice">
            Чтобы подписаться, <Link to="/login">войдите</Link> или <Link to="/register">зарегистрируйтесь</Link>.
          </p>
        )}
      </div>
      <h3>Предстоящие прогулки</h3>
      <div className="grid">
        {walks.length === 0 && <p className="muted">Предстоящих прогулок нет.</p>}
        {walks.map((w) => <WalkCard key={w.id} walk={w} />)}
      </div>
    </>
  )
}
