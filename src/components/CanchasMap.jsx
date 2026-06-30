import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const TANDIL = [-37.3217, -59.1332]

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

export default function CanchasMap({ canchas }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(TANDIL, 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Actualizar marcadores cuando cambian las canchas
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.eachLayer(l => { if (l instanceof L.Marker) map.removeLayer(l) })

    const conCoords = canchas.filter(c => c.latitud && c.longitud)
    const bounds = []
    conCoords.forEach(c => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#16a34a;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;line-height:1;">⚽</span></div>`,
        iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28],
      })
      const m = L.marker([c.latitud, c.longitud], { icon }).addTo(map)
      const precio = Number(c.precio_hora).toLocaleString('es-AR')
      m.bindPopup(
        `<div style="min-width:150px;font-family:inherit">
          <b>${escapeHtml(c.nombre)}</b><br>
          <span style="color:#64748b;font-size:12px">${escapeHtml(c.direccion)}</span><br>
          <span style="color:#16a34a;font-weight:700">$${precio}/h</span><br>
          <a href="/canchas/${c.id}" style="color:#16a34a;font-weight:600;text-decoration:none">Ver y reservar &rarr;</a>
        </div>`
      )
      bounds.push([c.latitud, c.longitud])
    })

    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
    else map.setView(TANDIL, 13)
    setTimeout(() => map.invalidateSize(), 80)
  }, [canchas])

  const sinCoords = canchas.filter(c => !c.latitud || !c.longitud).length

  return (
    <div>
      <div ref={containerRef} style={{ height: 480, width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', zIndex: 0 }} />
      {sinCoords > 0 && (
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          {sinCoords} cancha{sinCoords !== 1 ? 's' : ''} sin ubicación en el mapa (el dueño no cargó el link de Google Maps).
        </p>
      )}
    </div>
  )
}
