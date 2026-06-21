import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { timeToHour } from '../lib/tipoCancha'
import { Calendar, X, Share2, Star, MessageCircle } from 'lucide-react'
import StarRating from '../components/StarRating'
import { useSEO } from '../hooks/useSEO'

const ESTADO_BADGE = {
  pendiente: 'badge-yellow', confirmada: 'badge-green',
  cancelada: 'badge-red', completada: 'badge-gray',
}
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function formatFechaHumana(fechaStr) {
  const [y, m, d] = fechaStr.split('-').map(Number)
  return `${d} de ${MESES[m-1]} de ${y}`
}

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [reservas, setReservas] = useState([])
  const [resenas, setResenas] = useState({}) // reserva_id → reseña
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('proximas')
  const [confirmCancel, setConfirmCancel] = useState(null)
  const [cancelando, setCancelando] = useState(null)
  const [modalResena, setModalResena] = useState(null) // reserva object
  const [resenaForm, setResenaForm] = useState({ puntuacion: 0, comentario: '' })
  const [guardandoResena, setGuardandoResena] = useState(false)

  useSEO({ title: 'Mis turnos' })
  useEffect(() => { fetchReservas() }, [user])

  async function fetchReservas() {
    const { data: rs } = await supabase
      .from('reservas')
      .select('*, canchas(nombre, direccion, tipo, precio_hora)')
      .eq('jugador_id', user.id)
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: false })

    setReservas(rs || [])

    if (rs?.length) {
      const { data: ress } = await supabase
        .from('resenas')
        .select('*')
        .eq('jugador_id', user.id)
        .in('reserva_id', rs.map(r => r.id))
      const map = {}
      ress?.forEach(r => { map[r.reserva_id] = r })
      setResenas(map)
    }
    setLoading(false)
  }

  async function cancelarReserva(id) {
    setCancelando(id)
    await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', id).eq('jugador_id', user.id)
    setCancelando(null); setConfirmCancel(null)
    fetchReservas()
  }

  async function guardarResena() {
    if (!resenaForm.puntuacion) return
    setGuardandoResena(true)
    const payload = {
      cancha_id: modalResena.cancha_id,
      jugador_id: user.id,
      reserva_id: modalResena.id,
      puntuacion: resenaForm.puntuacion,
      comentario: resenaForm.comentario.trim() || null,
    }
    const existente = resenas[modalResena.id]
    if (existente) {
      await supabase.from('resenas').update({ puntuacion: payload.puntuacion, comentario: payload.comentario }).eq('id', existente.id)
    } else {
      await supabase.from('resenas').insert(payload)
    }
    setGuardandoResena(false)
    setModalResena(null)
    fetchReservas()
  }

  function abrirResena(r) {
    const existente = resenas[r.id]
    setResenaForm({ puntuacion: existente?.puntuacion || 0, comentario: existente?.comentario || '' })
    setModalResena(r)
  }

  function waCompartir(r) {
    const horaI = timeToHour(r.hora_inicio), horaF = timeToHour(r.hora_fin)
    const [y, m, d] = r.fecha.split('-')
    const link = `${window.location.origin}/reserva/${r.codigo}`
    const msg = `⚽ Reservé cancha en *${r.canchas?.nombre}*\n📅 ${d}/${m}/${y}\n🕐 ${horaI}:00 – ${horaF}:00 hs\n📍 ${r.canchas?.direccion}\n🎫 Código: ${r.codigo}\n\n${link}`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  const hoy = new Date().toISOString().split('T')[0]
  const proximas = reservas.filter(r => r.fecha >= hoy && r.estado !== 'cancelada')
  const pasadas  = reservas.filter(r => r.fecha < hoy || r.estado === 'cancelada')
  const lista = tab === 'proximas' ? proximas : pasadas

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Calendar size={22} style={{ color: 'var(--green)' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Mis turnos</h1>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab === 'proximas' ? 'active' : ''}`} onClick={() => setTab('proximas')}>
            Próximos ({proximas.length})
          </button>
          <button className={`tab-btn ${tab === 'pasadas' ? 'active' : ''}`} onClick={() => setTab('pasadas')}>
            Historial ({pasadas.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : lista.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <p>{tab === 'proximas' ? 'No tenés turnos próximos' : 'Sin historial de reservas'}</p>
            <span>
              {tab === 'proximas'
                ? <><Link to="/" style={{ color: 'var(--green)' }}>Buscá una cancha</Link> y reservá tu primer turno</>
                : 'Acá van a aparecer tus reservas pasadas'}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lista.map(r => {
              const horaI = timeToHour(r.hora_inicio)
              const horaF = timeToHour(r.hora_fin)
              const yaPaso = r.fecha < hoy
              const tieneResena = !!resenas[r.id]
              return (
                <div key={r.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{r.canchas?.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.canchas?.direccion}</div>
                    </div>
                    <span className={`badge ${ESTADO_BADGE[r.estado]}`}>{r.estado}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Fecha</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{formatFechaHumana(r.fecha)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Horario</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{horaI}:00 – {horaF}:00 hs</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Precio</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>${Number(r.monto || r.canchas?.precio_hora || 0).toLocaleString('es-AR')}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', background: 'var(--bg)', padding: '4px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        # {r.codigo}
                      </div>
                      {/* Reseña si ya pasó */}
                      {yaPaso && r.estado !== 'cancelada' && (
                        <button onClick={() => abrirResena(r)} className="btn btn-ghost btn-sm" style={{ color: tieneResena ? '#f59e0b' : 'var(--muted)' }}>
                          <Star size={14} style={{ fill: tieneResena ? '#f59e0b' : 'none' }} />
                          {tieneResena ? 'Ver reseña' : 'Calificar'}
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* Compartir */}
                      <a href={`/reserva/${r.codigo}`} target="_blank" rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm" title="Ver página de reserva">
                        <Share2 size={14} />
                      </a>
                      <a href={waCompartir(r)} target="_blank" rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm" title="Compartir por WhatsApp" style={{ color: '#25d366' }}>
                        <MessageCircle size={14} />
                      </a>

                      {/* Cancelar */}
                      {r.estado === 'pendiente' && tab === 'proximas' && (
                        confirmCancel === r.id ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button onClick={() => cancelarReserva(r.id)} className="btn btn-danger btn-sm" disabled={cancelando === r.id}>
                              {cancelando === r.id ? '...' : 'Sí, cancelar'}
                            </button>
                            <button onClick={() => setConfirmCancel(null)} className="btn btn-secondary btn-sm">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmCancel(r.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                            <X size={14} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de reseña */}
      {modalResena && (
        <div className="modal-overlay" onClick={() => setModalResena(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>{resenas[modalResena.id] ? 'Tu reseña' : 'Calificar cancha'}</h3>
              <button onClick={() => setModalResena(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontWeight: 600 }}>{modalResena.canchas?.nombre}</div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Puntuación *</div>
                <StarRating value={resenaForm.puntuacion} onChange={v => setResenaForm(f => ({ ...f, puntuacion: v }))} size={32} />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Comentario (opcional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="¿Cómo estuvo la cancha?"
                  value={resenaForm.comentario}
                  onChange={e => setResenaForm(f => ({ ...f, comentario: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModalResena(null)} className="btn btn-secondary">Cancelar</button>
              <button onClick={guardarResena} className="btn btn-primary" disabled={!resenaForm.puntuacion || guardandoResena}>
                {guardandoResena ? 'Guardando...' : resenas[modalResena.id] ? 'Actualizar reseña' : 'Publicar reseña'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
