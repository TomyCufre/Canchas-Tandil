import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { timeToHour } from '../lib/tipoCancha'
import { Users, Plus, Trash2, MessageCircle, Check } from 'lucide-react'

export default function DividirTurnoModal({ reserva, onClose }) {
  const [cantidad, setCantidad] = useState(10)
  const [participantes, setParticipantes] = useState([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [loading, setLoading] = useState(true)

  const total = Number(reserva.monto || reserva.canchas?.precio_hora || 0)
  const porPersona = cantidad > 0 ? Math.round(total / cantidad) : 0
  const pagaron = participantes.filter(p => p.pagado)
  const recaudado = pagaron.length * porPersona

  useEffect(() => {
    let vivo = true
    Promise.all([
      supabase.from('division_turno').select('cantidad_personas').eq('reserva_id', reserva.id).maybeSingle(),
      supabase.from('division_participante').select('*').eq('reserva_id', reserva.id).order('created_at'),
    ]).then(([{ data: div }, { data: parts }]) => {
      if (!vivo) return
      if (div?.cantidad_personas) setCantidad(div.cantidad_personas)
      setParticipantes(parts || [])
      setLoading(false)
    })
    return () => { vivo = false }
  }, [reserva.id])

  async function guardarCantidad(n) {
    const val = Math.max(1, Math.min(40, n || 1))
    setCantidad(val)
    await supabase.from('division_turno')
      .upsert({ reserva_id: reserva.id, cantidad_personas: val }, { onConflict: 'reserva_id' })
  }

  async function agregar(e) {
    e.preventDefault()
    const nombre = nuevoNombre.trim()
    if (!nombre) return
    setNuevoNombre('')
    const { data } = await supabase.from('division_participante')
      .insert({ reserva_id: reserva.id, nombre }).select().single()
    if (data) setParticipantes(p => [...p, data])
  }

  async function togglePagado(p) {
    setParticipantes(list => list.map(x => x.id === p.id ? { ...x, pagado: !x.pagado } : x))
    await supabase.from('division_participante').update({ pagado: !p.pagado }).eq('id', p.id)
  }

  async function quitar(p) {
    setParticipantes(list => list.filter(x => x.id !== p.id))
    await supabase.from('division_participante').delete().eq('id', p.id)
  }

  function waLink() {
    const [y, m, d] = reserva.fecha.split('-')
    const horaI = timeToHour(reserva.hora_inicio), horaF = timeToHour(reserva.hora_fin)
    const faltan = participantes.filter(p => !p.pagado).map(p => p.nombre)
    let msg = `⚽ *${reserva.canchas?.nombre}*\n`
      + `📅 ${d}/${m}/${y} · 🕐 ${horaI}:00 – ${horaF}:00 hs\n\n`
      + `💵 Total: $${total.toLocaleString('es-AR')}\n`
      + `👥 Somos ${cantidad} → *$${porPersona.toLocaleString('es-AR')} cada uno*`
    if (pagaron.length) msg += `\n\n✅ Ya pagaron: ${pagaron.map(p => p.nombre).join(', ')}`
    if (faltan.length)  msg += `\n⏳ Faltan: ${faltan.join(', ')}`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3><Users size={17} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Dividir el turno</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Cerrar">✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div className="loading-center" style={{ padding: 24 }}><div className="spinner" /></div>
          ) : (
            <>
              {/* Cuánto le toca a cada uno */}
              <div style={{ background: 'var(--green-50)', borderRadius: 'var(--radius-lg)', padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Le toca a cada uno</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--green-dark)', lineHeight: 1.2 }}>
                  ${porPersona.toLocaleString('es-AR')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  ${total.toLocaleString('es-AR')} entre {cantidad} {cantidad === 1 ? 'persona' : 'personas'}
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">¿Cuántos son?</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" onClick={() => guardarCantidad(cantidad - 1)} className="btn btn-secondary btn-sm" aria-label="Uno menos">−</button>
                  <input type="number" min="1" max="40" className="form-input" style={{ textAlign: 'center', width: 80 }}
                    value={cantidad} onChange={e => guardarCantidad(Number(e.target.value))} />
                  <button type="button" onClick={() => guardarCantidad(cantidad + 1)} className="btn btn-secondary btn-sm" aria-label="Uno más">+</button>
                </div>
              </div>

              {/* Quién pagó */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span className="form-label" style={{ margin: 0 }}>Quién pagó</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {pagaron.length}/{participantes.length || 0} · <b style={{ color: 'var(--green)' }}>${recaudado.toLocaleString('es-AR')}</b> de ${total.toLocaleString('es-AR')}
                  </span>
                </div>

                {total > 0 && (
                  <div style={{ background: 'var(--bg)', borderRadius: 99, height: 8, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ width: `${Math.min(100, (recaudado / total) * 100)}%`, background: 'var(--green)', height: '100%', transition: 'width .2s' }} />
                  </div>
                )}

                {participantes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {participantes.map(p => (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                        borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                        background: p.pagado ? 'var(--green-50)' : 'var(--card)',
                      }}>
                        <button onClick={() => togglePagado(p)} aria-label={p.pagado ? 'Marcar como no pagado' : 'Marcar como pagado'}
                          style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
                            border: `2px solid ${p.pagado ? 'var(--green)' : 'var(--border-dark)'}`,
                            background: p.pagado ? 'var(--green)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                          }}>
                          {p.pagado && <Check size={13} />}
                        </button>
                        <span style={{ flex: 1, fontSize: 14, textDecoration: p.pagado ? 'line-through' : 'none', color: p.pagado ? 'var(--muted)' : 'var(--text)' }}>
                          {p.nombre}
                        </span>
                        <button onClick={() => quitar(p)} className="btn btn-ghost btn-sm" aria-label="Quitar" style={{ color: 'var(--error)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={agregar} style={{ display: 'flex', gap: 6 }}>
                  <input className="form-input" placeholder="Nombre del jugador" value={nuevoNombre}
                    onChange={e => setNuevoNombre(e.target.value)} />
                  <button type="submit" className="btn btn-secondary" disabled={!nuevoNombre.trim()}>
                    <Plus size={15} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">Cerrar</button>
          <a href={waLink()} target="_blank" rel="noopener noreferrer"
            className="btn btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', background: '#25d366', border: 'none' }}>
            <MessageCircle size={15} /> Avisar al grupo
          </a>
        </div>
      </div>
    </div>
  )
}
