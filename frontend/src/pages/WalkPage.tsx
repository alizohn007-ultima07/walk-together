import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, errorMessage } from '../api'
import { SinglePointMap } from '../components/Maps'
import { formatDate } from '../constants'
import { useAuthStore } from '../store/authStore'
import type { UserShort, Walk, WalkComment } from '../types'

export default function WalkPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)

  const [walk, setWalk] = useState<Walk | null>(null)
  const [people, setPeople] = useState<UserShort[]>([])
  const [comments, setComments] = useState<WalkComment[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [w, p, c] = await Promise.all([
        api.get<Walk>(`/walks/${id}`),
        api.get<UserShort[]>(`/walks/${id}/participants`),
        api.get<WalkComment[]>(`/walks/${id}/comments`),
      ])
      setWalk(w.data)
      setPeople(p.data)
      setComments(c.data)
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load, token])

  if (error && !walk) return <p className="error">{error}</p>
  if (!walk) return <p className="muted">Загрузка…</p>

  const isOrganizer = user?.id === walk.organizer.id
  const full = walk.participants_count >= walk.max_participants
  const past = new Date(walk.start_time) < new Date()

  const toggleJoin = async () => {
    setError('')
    try {
      if (walk.is_joined) await api.delete(`/walks/${walk.id}/join`)
      else await api.post(`/walks/${walk.id}/join`)
      await load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const remove = async () => {
    if (!confirm('Удалить прогулку безвозвратно?')) return
    try {
      await api.delete(`/walks/${walk.id}`)
      navigate('/my')
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const addComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    try {
      await api.post(`/walks/${walk.id}/comments`, { text })
      setText('')
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const removeComment = async (cid: number) => {
    try {
      await api.delete(`/comments/${cid}`)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="walk-page">
      <div className="walk-main">
        <span className="tag">{walk.category}</span>
        <h1>{walk.title}</h1>
        <p className="muted">
          Организатор: <Link to={`/users/${walk.organizer.id}`}>{walk.organizer.username}</Link>
        </p>
        <p>📅 <b>{formatDate(walk.start_time)}</b></p>
        <p>📍 {walk.city}, {walk.address}</p>
        <p className="description">{walk.description}</p>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          {isOrganizer ? (
            <>
              <Link className="btn" to={`/walks/${walk.id}/edit`}>Редактировать</Link>
              <button className="btn btn-danger" onClick={remove}>Удалить</button>
            </>
          ) : user ? (
            <button
              className={walk.is_joined ? 'btn btn-ghost' : 'btn'}
              onClick={toggleJoin}
              disabled={!walk.is_joined && (full || past)}
            >
              {walk.is_joined ? 'Отменить запись' : past ? 'Прогулка прошла' : full ? 'Мест нет' : 'Записаться'}
            </button>
          ) : (
            <p className="notice">
              Чтобы записаться на прогулку, <Link to="/login">войдите</Link> или{' '}
              <Link to="/register">зарегистрируйтесь</Link>.
            </p>
          )}
        </div>

        <h3>Комментарии ({comments.length})</h3>
        {comments.length === 0 && <p className="muted">Пока никто не писал. Задайте вопрос организатору!</p>}
        {comments.map((c) => (
          <div className="comment" key={c.id}>
            <div className="comment-head">
              <Link to={`/users/${c.author.id}`}><b>{c.author.username}</b></Link>
              <span className="muted">{formatDate(c.created_at)}</span>
              {user?.id === c.author.id && (
                <button className="link-btn" onClick={() => removeComment(c.id)}>Удалить</button>
              )}
            </div>
            <p>{c.text}</p>
          </div>
        ))}

        {user ? (
          <form className="comment-form" onSubmit={addComment}>
            <textarea
              placeholder="Ваш комментарий…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              rows={3}
            />
            <button className="btn">Отправить</button>
          </form>
        ) : (
          <p className="notice">
            Чтобы оставить комментарий, <Link to="/login">войдите</Link> или{' '}
            <Link to="/register">зарегистрируйтесь</Link>.
          </p>
        )}
      </div>

      <aside className="walk-side">
        <SinglePointMap lat={walk.latitude} lng={walk.longitude} />
        <div className="panel">
          <h3>Участники ({walk.participants_count}/{walk.max_participants})</h3>
          {people.length === 0 ? (
            <p className="muted">Пока никто не записался</p>
          ) : (
            <ul className="people">
              {people.map((p) => (
                <li key={p.id}><Link to={`/users/${p.id}`}>👤 {p.username}</Link></li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}
