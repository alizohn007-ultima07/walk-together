export const CATEGORIES = [
  'Парк',
  'Набережная',
  'Поход',
  'С собакой',
  'С детьми',
  'Экскурсия по городу',
  'Спортивная прогулка',
]

export const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423] // Москва

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function toLocalInput(iso: string): string {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
