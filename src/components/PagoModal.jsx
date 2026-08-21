import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { timeToHour } from '../lib/tipoCancha'
import { CreditCard, ShieldCheck } from 'lucide-react'

export default function PagoModal({ reserva, onClose }) {
  const cancha = reserva.canchas || {}
  const total = Number(reserva.monto || cancha.precio_hora || 0)
  const sena = cancha.requiere_sena && cancha.sena_monto ? Number(cancha.sena_monto) : null

  const [tipo, setTipo] = useState(sena ? 'sena' : 'total')
  const [yendo, setYendo] = useState(false)
  const [error, setError] = useState('')

  const [y, m, d] = reserva.fecha.split('-')
  const horaI = timeToHour(reserva.hora_inicio)

  async function pagar() {
    setYendo(true); setError('')
    const { data, error: fnError } = await supabase.functions.invoke('crear-pago', {
      body: { reserva_id: reserva.id, tipo, origen: window.location.origin },
    })

    let payload = data
    if (fnError) {
      try { payload = await fnError.context?.json() } catch { payload = null }
    }

    if (payload?.url) {
      window.location.href = payload.url      // al checkout de Mercado Pago
      return
    }
    setYendo(false)
    setError(payload?.error || 'No pudimos iniciar el pago. Probá de nuevo en un momento.')
  }

  const opciones = [
    sena && { valor: 'sena', titulo: 'Pagar la seña', monto: sena, detalle: `Después abonás $${(total - sena).toLocaleString('es-AR')} en la cancha` },
    { valor: 'total', titulo: 'Pagar todo el turno', monto: total, detalle: 'Llegás con todo pago' },
  ].filter(Boolean)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>Pagar con Mercado Pago</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Cerrar">✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{cancha.nombre}</div>
            <div className="mono-caps" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {d}/{m}/{y} · {horaI}:00 hs · Total ${total.toLocaleString('es-AR')}
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opciones.map(o => {
              const activo = tipo === o.valor
              return (
                <label key={o.valor} style={{
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  border: `1.5px solid ${activo ? 'var(--green)' : 'var(--border-dark)'}`,
                  background: activo ? 'var(--green-50)' : 'transparent',
                  borderRadius: 'var(--radius)', padding: '12px 14px',
                  transition: 'all .15s',
                }}>
                  <input type="radio" name="tipo-pago" value={o.valor} checked={activo}
                    onChange={() => setTipo(o.valor)} style={{ display: 'none' }} />
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${activo ? 'var(--green)' : 'var(--border-dark)'}`,
                    background: activo ? 'var(--green)' : 'transparent',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{o.titulo}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{o.detalle}</div>
                  </div>
                  <div className="mono-caps" style={{ fontSize: 15, color: activo ? 'var(--green)' : 'var(--text)' }}>
                    ${o.monto.toLocaleString('es-AR')}
                  </div>
                </label>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              El pago se procesa en Mercado Pago y se acredita <b>directamente en la cuenta del complejo</b>.
              Canchas Tandil no retiene el dinero.
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button onClick={pagar} className="btn btn-primary" disabled={yendo}>
            {yendo
              ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Redirigiendo...</>
              : <><CreditCard size={15} /> Ir a pagar</>}
          </button>
        </div>
      </div>
    </div>
  )
}
