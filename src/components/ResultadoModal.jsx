import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { timeToHour } from '../lib/tipoCancha'
import { Trophy, Handshake, Frown, Trash2 } from 'lucide-react'

const OPCIONES = [
  { valor: 'ganado',    label: 'Ganamos',   Icono: Trophy,    color: 'var(--green)' },
  { valor: 'empatado',  label: 'Empatamos', Icono: Handshake, color: 'var(--muted)' },
  { valor: 'perdido',   label: 'Perdimos',  Icono: Frown,     color: 'var(--error)' },
]

export default function ResultadoModal({ reserva, onClose, onGuardado }) {
  const [resultado, setResultado] = useState(reserva.resultado || null)
  const [marcador, setMarcador] = useState(reserva.marcador || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [y, m, d] = reserva.fecha.split('-')
  const horaI = timeToHour(reserva.hora_inicio)

  async function guardar() {
    if (!resultado) return
    setGuardando(true); setError('')
    const { error: err } = await supabase
      .from('reservas')
      .update({ resultado, marcador: marcador.trim() || null })
      .eq('id', reserva.id)
    setGuardando(false)
    if (err) { setError('No pudimos guardar el resultado. Probá de nuevo.'); return }
    onGuardado?.()
    onClose()
  }

  async function borrar() {
    setGuardando(true); setError('')
    const { error: err } = await supabase
      .from('reservas')
      .update({ resultado: null, marcador: null })
      .eq('id', reserva.id)
    setGuardando(false)
    if (err) { setError('No pudimos borrar el resultado.'); return }
    onGuardado?.()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3>¿Cómo salió?</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Cerrar">✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{reserva.canchas?.nombre}</div>
            <div className="mono-caps" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {d}/{m}/{y} · {horaI}:00 hs
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Resultado */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {OPCIONES.map(({ valor, label, Icono, color }) => {
              const activo = resultado === valor
              return (
                <button
                  key={valor}
                  onClick={() => setResultado(valor)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '14px 6px', cursor: 'pointer',
                    borderRadius: 'var(--radius)',
                    border: `1.5px solid ${activo ? color : 'var(--border-dark)'}`,
                    background: activo ? 'var(--green-50)' : 'transparent',
                    color: activo ? color : 'var(--muted)',
                    transition: 'all .15s',
                  }}
                >
                  <Icono size={22} />
                  <span className="mono-caps" style={{ fontSize: 10 }}>{label}</span>
                </button>
              )
            })}
          </div>

          {/* Marcador opcional */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Marcador <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
            <input
              className="form-input"
              placeholder="Ej: 4-2"
              value={marcador}
              maxLength={12}
              onChange={e => setMarcador(e.target.value)}
              style={{ fontFamily: 'var(--font-mono-caps)', fontSize: 16, textAlign: 'center', letterSpacing: '0.1em' }}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          {reserva.resultado ? (
            <button onClick={borrar} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} disabled={guardando}>
              <Trash2 size={14} /> Borrar
            </button>
          ) : <span />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="btn btn-secondary">Ahora no</button>
            <button onClick={guardar} className="btn btn-primary" disabled={!resultado || guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
