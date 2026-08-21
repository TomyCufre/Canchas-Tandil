import { Link } from 'react-router-dom'
import { MapPin, Star, Heart, Lightbulb, ShirtIcon, Car } from 'lucide-react'
import { TIPO_LABEL } from '../lib/tipoCancha'

const TIPO_CORTO = {
  futbol5: '5v5', futbol6: '6v6', futbol7: '7v7',
  futbol8: '8v8', futbol11: '11v11', techo: 'Techo', indoor: 'Indoor',
}

export default function CourtCard({ cancha, rating, esFavorito, onToggleFavorito, distancia }) {
  const fotos = cancha.fotos?.length ? cancha.fotos : (cancha.foto_url ? [cancha.foto_url] : [])
  const foto = fotos[0]
  const label = TIPO_CORTO[cancha.tipo] || TIPO_LABEL[cancha.tipo] || cancha.tipo

  return (
    <Link to={`/canchas/${cancha.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="card"
        style={{ cursor: 'pointer', transition: 'transform .15s, box-shadow .15s, border-color .15s', height: '100%', display: 'flex', flexDirection: 'column' }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          e.currentTarget.style.borderColor = 'var(--green)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = ''
          e.currentTarget.style.boxShadow = ''
          e.currentTarget.style.borderColor = ''
        }}
      >
        {/* Cabecera con foto a sangre */}
        <div style={{
          height: 170, position: 'relative', flexShrink: 0, overflow: 'hidden',
          background: foto
            ? `url(${foto}) center/cover`
            : 'linear-gradient(135deg, color-mix(in srgb, var(--green) 18%, var(--card)), var(--card))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!foto && <span style={{ fontSize: 44, opacity: 0.35 }}>⚽</span>}

          {/* Degradado inferior para asentar el texto */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, var(--card) 0%, transparent 55%)',
          }} />

          {/* Puntuación */}
          {rating && (
            <span className="mono-caps" style={{
              position: 'absolute', top: 10, left: 10,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'color-mix(in srgb, var(--card) 85%, transparent)',
              backdropFilter: 'blur(4px)',
              border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 11,
              padding: '4px 8px', borderRadius: 'var(--radius)',
            }}>
              <Star size={11} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
              {rating.promedio.toFixed(1)}
              <span style={{ color: 'var(--muted)' }}>({rating.cantidad})</span>
            </span>
          )}

          {/* Favorito */}
          {onToggleFavorito && (
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFavorito(cancha.id) }}
              title={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              aria-label={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              style={{
                position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 'var(--radius)',
                background: 'color-mix(in srgb, var(--card) 85%, transparent)',
                backdropFilter: 'blur(4px)',
                border: '1px solid var(--border)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Heart size={16} style={{ color: esFavorito ? '#ef4444' : 'var(--muted)', fill: esFavorito ? '#ef4444' : 'none' }} />
            </button>
          )}

          {/* Modalidad */}
          <span className="mono-caps" style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'var(--green-50)', color: 'var(--green)',
            border: '1px solid color-mix(in srgb, var(--green) 40%, transparent)',
            fontSize: 11, padding: '3px 9px', borderRadius: 'var(--radius)',
          }}>
            {label}
          </span>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25, marginBottom: 4 }}>
            {cancha.nombre}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>
            <MapPin size={12} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cancha.direccion}
              {distancia != null && ` · a ${distancia < 1 ? Math.round(distancia * 1000) + ' m' : distancia.toFixed(1) + ' km'}`}
            </span>
          </div>

          {/* Servicios */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', marginBottom: 12 }}>
            {cancha.tiene_iluminacion && <span title="Iluminación" style={{ display: 'inline-flex' }}><Lightbulb size={15} /></span>}
            {cancha.tiene_vestuario && <span title="Vestuario" style={{ display: 'inline-flex' }}><ShirtIcon size={15} /></span>}
            {cancha.tiene_estacionamiento && <span title="Estacionamiento" style={{ display: 'inline-flex' }}><Car size={15} /></span>}
            {(cancha.tiene_una_pelota || cancha.tiene_dos_pelotas) && <span title={cancha.tiene_dos_pelotas ? '2 pelotas' : '1 pelota'}>⚽</span>}
            {cancha.tiene_pecheras && <span title="Pecheras">🎽</span>}
          </div>

          {/* Precio + acción */}
          <div style={{
            marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8,
          }}>
            <div>
              <div className="mono-caps" style={{ fontSize: 10, color: 'var(--muted)' }}>Por turno</div>
              <div className="mono-caps" style={{ fontSize: 17, color: 'var(--green)', letterSpacing: '0.02em' }}>
                ${Number(cancha.precio_hora).toLocaleString('es-AR')}
              </div>
              {cancha.precio_por_persona && (
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  ≈ ${Number(cancha.precio_por_persona).toLocaleString('es-AR')} p/p
                </div>
              )}
            </div>
            <span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>Reservar</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
