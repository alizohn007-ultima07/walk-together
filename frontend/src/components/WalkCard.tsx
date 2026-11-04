import { Link } from 'react-router-dom'
import { formatDate } from '../constants'
import type { Walk } from '../types'

export default function WalkCard({ walk }: { walk: Walk }) {
  const left = walk.max_participants - walk.participants_count
  return (
    <article className="card">
      <div className="card-top">
        <span className="tag">{walk.category}</span>
        {walk.is_joined && <span className="tag tag-green">Вы записаны</span>}
      </div>
      <h3><Link to={`/walks/${walk.id}`}>{walk.title}</Link></h3>
      <p className="muted">📅 {formatDate(walk.start_time)}</p>
      <p className="muted">📍 {walk.city}, {walk.address}</p>
      <p className="card-desc">
        {walk.description.length > 120 ? walk.description.slice(0, 120) + '…' : walk.description}
      </p>
      <div className="card-bottom">
        <Link to={`/users/${walk.organizer.id}`} className="muted">👤 {walk.organizer.username}</Link>
        <span className={left > 0 ? 'seats' : 'seats seats-zero'}>
          {left > 0 ? `Свободно мест: ${left}` : 'Мест нет'}
        </span>
      </div>
    </article>
  )
}
