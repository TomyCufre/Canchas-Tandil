import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import { TIPO_LABEL } from '../lib/tipoCancha'

const TIPO_BADGE = {
  futbol5: 'badge-green',
  futbol7: 'badge-blue',
  futbol11: 'badge-yellow',
  techo: 'badge-gray',
  indoor: 'badge-gray',
}

export default function CourtCard({ cancha }) {
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
          height: 180,
          background: foto ? `url(${foto}) center/cover` : 'linear-gradient(135deg, #16a34a22, #16a34a44)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {!foto && <span style={{ fontSize: 48 }}>⚽</span>}
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
