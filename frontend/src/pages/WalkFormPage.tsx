import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, errorMessage } from '../api'
import { LocationPicker } from '../components/Maps'
import { CATEGORIES, toLocalInput } from '../constants'
import { useAuthStore } from '../store/authStore'
import type { Walk } from '../types'

interface FormState {
  title: string
  description: string
  category: string
  city: string
  address: string
  start_time: string
  max_participants: number
  latitude: number | null
  longitude: number | null
}

export default function WalkFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [f, setF] = useState<FormState>({
    title: '',
    description: '',
    category: CATEGORIES[0],
    city: user?.city ?? '',
    address: '',
    start_time: '',
    max_participants: 5,
    latitude: null,
    longitude: null,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!editing) return
    api.get<Walk>(`/walks/${id}`)
      .then(({ data }) => {
        if (user && data.organizer.id !== user.id) {
          navigate(`/walks/${id}`)
          return
        }
        setF({
          title: data.title,
          description: data.description,
          category: data.category,
          city: data.city,
          address: data.address,
          start_time: toLocalInput(data.start_time),
          max_participants: data.max_participants,
          latitude: data.latitude,
          longitude: data.longitude,
        })
      })
      .catch((e) => setError(errorMessage(e)))
  }, [editing, id, navigate, user])

  const set = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setF({ ...f, [k]: k === 'max_participants' ? Number(e.target.value) : e.target.value })

  // Поиск координат по адресу (бесплатный геокодер OpenStreetMap Nominatim)
  const findOnMap = async () => {
    const query = `${f.city} ${f.address}`.trim()
    if (!query) return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      )
      const data: { lat: string; lon: string }[] = await res.json()
      if (data.length === 0) {
        setError('Адрес не найден. Укажите точку на карте кликом.')
        return
      }
      setError('')
      setF((prev) => ({ ...prev, latitude: Number(data[0].lat), longitude: Number(data[0].lon) }))
    } catch {
      setError('Не удалось выполнить поиск. Укажите точку на карте кликом.')
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (f.latitude == null || f.longitude == null) {
      setError('Укажите место встречи на карте (клик по карте или кнопка «Найти на карте»)')
      return
    }
    setBusy(true)
    setError('')
    const payload = {
      title: f.title,
      description: f.description,
      category: f.category,
      city: f.city,
      address: f.address,
      latitude: f.latitude,
      longitude: f.longitude,
      start_time: new Date(f.start_time).toISOString(),
      max_participants: f.max_participants,
    }
    try {
      const { data } = editing
        ? await api.put<Walk>(`/walks/${id}`, payload)
        : await api.post<Walk>('/walks', payload)
      navigate(`/walks/${data.id}`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <h2>{editing ? 'Редактирование прогулки' : 'Новая прогулка'}</h2>
      {error && <p className="error">{error}</p>}

      <label>Название
        <input value={f.title} onChange={set('title')} minLength={3} maxLength={150} required />
      </label>
      <label>Тип прогулки
        <select value={f.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label>Описание
        <textarea value={f.description} onChange={set('description')} rows={5} required />
      </label>

      <div className="row">
        <label>Дата и время
          <input type="datetime-local" value={f.start_time} onChange={set('start_time')} required />
        </label>
        <label>Сколько человек можно позвать
          <input type="number" min={1} max={200} value={f.max_participants} onChange={set('max_participants')} required />
        </label>
      </div>

      <div className="row">
        <label>Город
          <input value={f.city} onChange={set('city')} required />
        </label>
        <label>Адрес / место встречи
          <input value={f.address} onChange={set('address')} required />
        </label>
      </div>

      <button type="button" className="btn btn-ghost" onClick={findOnMap}>🔍 Найти на карте</button>
      <p className="muted">Кликните по карте, чтобы поставить точку встречи.</p>
      <LocationPicker
        lat={f.latitude}
        lng={f.longitude}
        onChange={(la, ln) => setF((p) => ({ ...p, latitude: la, longitude: ln }))}
      />

      <button className="btn" disabled={busy}>{busy ? 'Сохраняем…' : editing ? 'Сохранить' : 'Опубликовать'}</button>
    </form>
  )
}
