import { FormEvent, useEffect, useState } from 'react'
import WalkCard from '../components/WalkCard'
import { WalksMap } from '../components/Maps'
import { CATEGORIES } from '../constants'
import { useAuthStore } from '../store/authStore'
import { useWalksStore } from '../store/walksStore'
import type { Filters } from '../types'

const EMPTY: Filters = { q: '', city: '', category: '', date_from: '' }

export default function HomePage() {
  const [form, setForm] = useState<Filters>(EMPTY)
  const [applied, setApplied] = useState<Filters>(EMPTY)
  const [view, setView] = useState<'list' | 'map'>('list')
  const { walks, loading, error, fetchWalks } = useWalksStore()
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    fetchWalks(applied)
  }, [applied, token, fetchWalks])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setApplied(form)
  }
  const reset = () => {
    setForm(EMPTY)
    setApplied(EMPTY)
  }
  const set = (k: keyof Filters) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <section className="hero">
        <h1>Найдите компанию для прогулки</h1>
        <p>Присоединяйтесь к прогулкам рядом с вами или создайте свою — знакомьтесь и гуляйте вместе.</p>
      </section>

      <form className="filters" onSubmit={submit}>
        <input placeholder="Поиск по названию" value={form.q} onChange={set('q')} />
        <input placeholder="Город" value={form.city} onChange={set('city')} />
        <select value={form.category} onChange={set('category')}>
          <option value="">Все типы</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input type="date" value={form.date_from} onChange={set('date_from')} title="Начиная с даты" />
        <button className="btn" type="submit">Найти</button>
        <button className="btn btn-ghost" type="button" onClick={reset}>Сбросить</button>
      </form>

      <div className="tabs">
        <button className={view === 'list' ? 'tab active' : 'tab'} onClick={() => setView('list')}>Списком</button>
        <button className={view === 'map' ? 'tab active' : 'tab'} onClick={() => setView('map')}>На карте</button>
        <span className="muted">Найдено: {walks.length}</span>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Загрузка…</p>}
      {!loading && walks.length === 0 && !error && (
        <p className="muted">Прогулок пока нет. Станьте первым — создайте свою!</p>
      )}

      {view === 'list' ? (
        <div className="grid">
          {walks.map((w) => (
            <WalkCard key={w.id} walk={w} />
          ))}
        </div>
      ) : (
        <WalksMap walks={walks} />
      )}
    </>
  )
}
