import { Link } from 'react-router-dom'
import { MapPin, Star, Heart } from 'lucide-react'
import { TIPO_LABEL } from '../lib/tipoCancha'

const TIPO_BADGE = {
  futbol5: 'badge-green',
  futbol6: 'badge-green',
  futbol7: 'badge-blue',
  futbol8: 'badge-blue',
  futbol11: 'badge-yellow',
  techo: 'badge-gray',
  indoor: 'badge-gray',
}

export default function CourtCard({ cancha, rating, esFavorito, onToggleFavorito }) {
  const fotos = cancha.fotos?.length ? cancha.fotos : (cancha.foto_url ? [cancha.foto_url] : [])
  const foto = fotos[0]
  const label = TIPO_LABEL[cancha.tipo] || cancha.tipo

  return (
    <Link to={`/canchas/${cancha.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      >
        <div style={{
          height: 180, position: 'relative',
          background: foto ? `url(${foto}) center/cover` : 'linear-gradient(135deg, #16a34a22, #16a34a44)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {!foto && <span style={{ fontSize: 48 }}>⚽</span>}
          {onToggleFavorito && (
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFavorito(cancha.id) }}
              title={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              style={{
                position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)',
              }}
            >
              <Heart size={18} style={{ color: esFavorito ? '#ef4444' : '#94a3b8', fill: esFavorito ? '#ef4444' : 'none' }} />
            </button>
          )}
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{cancha.nombre}</h3>
            <span className={`badge ${TIPO_BADGE[cancha.tipo] || 'badge-gray'}`} style={{ flexShrink: 0 }}>{label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>
            <MapPin size={12} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cancha.direccion}</span>
          </div>
          {rating
            ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginBottom: 8 }}>
                <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                <span style={{ fontWeight: 700 }}>{rating.promedio.toFixed(1)}</span>
                <span style={{ color: 'var(--muted)' }}>({rating.cantidad})</span>
              </div>
            )
            : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginBottom: 8, color: 'var(--muted)' }}>
                <Star size={13} /> Sin reseñas
              </div>
            )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)', fontSize: 12 }}>
              {cancha.tiene_iluminacion && <span title="Iluminación">💡</span>}
              {cancha.tiene_vestuario && <span title="Vestuario">🚿</span>}
              {cancha.tiene_estacionamiento && <span title="Estacionamiento">🅿️</span>}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 15 }}>
              ${Number(cancha.precio_hora).toLocaleString('es-AR')}/h
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
