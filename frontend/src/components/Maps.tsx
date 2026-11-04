import { useEffect, useRef } from 'react'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { DEFAULT_CENTER } from '../constants'
import type { Walk } from '../types'

// Иконки маркеров по умолчанию (иначе Vite теряет пути к картинкам)
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

/** Карта со всеми прогулками (маркеры + всплывающие окна) */
export function WalksMap({ walks }: { walks: Walk[] }) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    const map = L.map(elRef.current!).setView(DEFAULT_CENTER, 11)
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    walks.forEach((w) => {
      L.marker([w.latitude, w.longitude])
        .bindPopup(`<b>${esc(w.title)}</b><br/>${esc(w.address)}<br/><a href="/walks/${w.id}">Открыть</a>`)
        .addTo(layer)
    })
    if (walks.length > 0) {
      map.fitBounds(L.latLngBounds(walks.map((w) => [w.latitude, w.longitude] as [number, number])), {
        padding: [40, 40],
        maxZoom: 15,
      })
    }
  }, [walks])

  return <div ref={elRef} className="map" />
}

/** Карта с одним маркером (страница прогулки) */
export function SinglePointMap({ lat, lng }: { lat: number; lng: number }) {
  const elRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const map = L.map(elRef.current!).setView([lat, lng], 15)
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map)
    L.marker([lat, lng]).addTo(map)
    return () => {
      map.remove()
    }
  }, [lat, lng])
  return <div ref={elRef} className="map map-small" />
}

/** Выбор точки встречи кликом по карте */
export function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const cbRef = useRef(onChange)
  cbRef.current = onChange

  useEffect(() => {
    const start: [number, number] = lat != null && lng != null ? [lat, lng] : DEFAULT_CENTER
    const map = L.map(elRef.current!).setView(start, lat != null ? 15 : 11)
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map)
    map.on('click', (e: L.LeafletMouseEvent) => cbRef.current(e.latlng.lat, e.latlng.lng))
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || lat == null || lng == null) return
    if (markerRef.current) markerRef.current.setLatLng([lat, lng])
    else markerRef.current = L.marker([lat, lng]).addTo(map)
    if (!map.getBounds().contains([lat, lng])) map.setView([lat, lng], 15)
  }, [lat, lng])

  return <div ref={elRef} className="map map-small" />
}
