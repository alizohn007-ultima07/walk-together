import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../api'
import WalkCard from '../components/WalkCard'
import { formatDate } from '../constants'
import type { UserShort, Walk } from '../types'

type Tab = 'organized' | 'joined' | 'subs'

export default function MyWalksPage() {
  const [tab, setTab] = useState<Tab>('organized')
  const [organized, setOrganized] = useState<Walk[]>([])
  const [joined, setJoined] = useState<Walk[]>([])
  const [subs, setSubs] = useState<UserShort[]>([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [a, b, c] = await Promise.all([
        api.get<Walk[]>('/walks/my/organized'),
        api.get<Walk[]>('/walks/my/joined'),
        api.get<UserShort[]>('/users/me/subscriptions'),
      ])
      setOrganized(a.data)
      setJoined(b.data)
      setSubs(c.data)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  useEffect(() => {
    load()
  }, [])

  const remove = async (id: number) => {
    if (!confirm('Удалить прогулку безвозвратно?')) return
    try {
      await api.delete(`/walks/${id}`)
      await load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <>
      <h2>Мои прогулки</h2>
      {error && <p className="error">{error}</p>}
      <div className="tabs">
        <button className={tab === 'organized' ? 'tab active' : 'tab'} onClick={() => setTab('organized')}>
          Я организую ({organized.length})
        </button>
        <button className={tab === 'joined' ? 'tab active' : 'tab'} onClick={() => setTab('joined')}>
          Я иду ({joined.length})
        </button>
        <button className={tab === 'subs' ? 'tab active' : 'tab'} onClick={() => setTab('subs')}>
          Подписки ({subs.length})
        </button>
      </div>

      {tab === 'organized' && (
        <>
          <Link className="btn" to="/walks/new">+ Создать прогулку</Link>
          <div className="table">
            {organized.length === 0 && <p className="muted">Вы ещё не создали ни одной прогулки.</p>}
            {organized.map((w) => (
              <div className="row-item" key={w.id}>
                <div>
                  <Link to={`/walks/${w.id}`}><b>{w.title}</b></Link>
                  <p className="muted">
                    {formatDate(w.start_time)} · записались: {w.participants_count}/{w.max_participants}
                  </p>
                </div>
                <div className="actions">
                  <Link className="btn btn-ghost" to={`/walks/${w.id}/edit`}>Изменить</Link>
                  <button className="btn btn-danger" onClick={() => remove(w.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'joined' && (
        <div className="grid">
          {joined.length === 0 && <p className="muted">Вы пока не записаны ни на одну прогулку.</p>}
          {joined.map((w) => <WalkCard key={w.id} walk={w} />)}
        </div>
      )}

      {tab === 'subs' && (
        <ul className="people">
          {subs.length === 0 && <p className="muted">Вы ни на кого не подписаны.</p>}
          {subs.map((s) => (
            <li key={s.id}><Link to={`/users/${s.id}`}>👤 {s.username}</Link></li>
          ))}
        </ul>
      )}
    </>
  )
}
