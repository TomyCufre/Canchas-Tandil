import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TIPO_LABEL, timeToHour } from '../lib/tipoCancha'
import { Plus, Edit2, Trash2, Eye, EyeOff, Clock, CalendarCheck, CheckCircle, XCircle, MessageCircle, ChevronLeft, ChevronRight, CalendarDays, Star, MessageSquare, BarChart3, Download } from 'lucide-react'
import StarRating from '../components/StarRating'
import { useSEO } from '../hooks/useSEO'

const ESTADO_BADGE = {
  pendiente: 'badge-yellow', confirmada: 'badge-green',
  cancelada: 'badge-red', completada: 'badge-gray',
}

async function notificar(tipo, reserva_id) {
  try {
    await supabase.functions.invoke('notify-reserva', { body: { tipo, reserva_id } })
  } catch { /* silencioso */ }
}

export default function OwnerDashboardPage() {
  const { user } = useAuth()
  const [canchas, setCanchas] = useState([])
  const [reservas, setReservas] = useState([])
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('canchas')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useSEO({ title: 'Panel del dueño' })
  useEffect(() => {
    fetchData()
    const channel = supabase.channel('owner-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservas' }, () => fetchData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  async function fetchData() {
    const [{ data: cs }, { data: rs }, { data: res }] = await Promise.all([
      supabase.from('canchas').select('*').eq('dueno_id', user.id).order('created_at', { ascending: false }),
      supabase.from('reservas')
        .select('*, canchas!inner(nombre, dueno_id, precio_hora)')
        .eq('canchas.dueno_id', user.id)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false })
        .limit(200),
      supabase.from('resenas')
        .select('*, canchas!inner(nombre, dueno_id), perfiles(nombre)')
        .eq('canchas.dueno_id', user.id)
        .order('created_at', { ascending: false }),
    ])
    setCanchas(cs || [])
    setReservas(rs || [])
    setResenas(res || [])
    setLoading(false)
  }

  async function toggleActiva(c) {
    await supabase.from('canchas').update({ activa: !c.activa }).eq('id', c.id)
    fetchData()
  }

  async function deleteCancha(id) {
    setDeletingId(id)
    const { count } = await supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('cancha_id', id).neq('estado', 'cancelada')
    if (count > 0) {
      alert('No podés eliminar una cancha con reservas activas.')
      setDeletingId(null); setConfirmDelete(null); return
    }
    await supabase.from('canchas').delete().eq('id', id)
    setDeletingId(null); setConfirmDelete(null)
    fetchData()
  }

  const hoy = new Date().toISOString().split('T')[0]
  const hace30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]

  const reservasHoy = reservas.filter(r => r.fecha === hoy && r.estado !== 'cancelada')
  const ingresosHoy = reservasHoy.reduce((s, r) => s + Number(r.monto || r.canchas?.precio_hora || 0), 0)
  const reservas30  = reservas.filter(r => r.fecha >= hace30 && r.fecha <= hoy && r.estado !== 'cancelada')
  const ingresos30  = reservas30.reduce((s, r) => s + Number(r.monto || r.canchas?.precio_hora || 0), 0)
  const proximas    = reservas.filter(r => r.fecha >= hoy && r.estado !== 'cancelada')
  const pendientes  = reservas.filter(r => r.estado === 'pendiente')

  if (loading) return (
    <div className="page"><div className="container">
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 16 }}>
            <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 24, width: '40%' }} />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div className="skeleton" style={{ height: 48, width: '100%' }} />
        </div>
      ))}
    </div></div>
  )

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Panel de administración</h1>
          <Link to="/panel/canchas/nueva" className="btn btn-primary"><Plus size={16} /> Nueva cancha</Link>
        </div>

        {pendientes.length > 0 && (
          <div className="alert" style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <span><b>{pendientes.length} reserva{pendientes.length > 1 ? 's' : ''} pendiente{pendientes.length > 1 ? 's' : ''}</b> esperando confirmación</span>
            <button onClick={() => setTab('proximas')} className="btn btn-sm" style={{ marginLeft: 'auto', background: '#92400e', color: 'white', border: 'none' }}>Ver</button>
          </div>
        )}

        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Reservas hoy</div>
            <div className="stat-value">{reservasHoy.length}</div>
            <div className="stat-sub">turnos</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ingresos hoy</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>${ingresosHoy.toLocaleString('es-AR')}</div>
            <div className="stat-sub">estimado</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ingresos 30 días</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>${ingresos30.toLocaleString('es-AR')}</div>
            <div className="stat-sub">{reservas30.length} reservas</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Mis canchas</div>
            <div className="stat-value">{canchas.length}</div>
            <div className="stat-sub">{canchas.filter(c => c.activa).length} activas</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab === 'canchas' ? 'active' : ''}`} onClick={() => setTab('canchas')}>Mis canchas ({canchas.length})</button>
          <button className={`tab-btn ${tab === 'calendario' ? 'active' : ''}`} onClick={() => setTab('calendario')}>
            <CalendarDays size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Calendario
          </button>
          <button className={`tab-btn ${tab === 'proximas' ? 'active' : ''}`} onClick={() => setTab('proximas')}>
            Próximas ({proximas.length})
            {pendientes.length > 0 && <span className="badge badge-yellow" style={{ marginLeft: 6 }}>{pendientes.length}</span>}
          </button>
          <button className={`tab-btn ${tab === 'historial' ? 'active' : ''}`} onClick={() => setTab('historial')}>Historial</button>
          <button className={`tab-btn ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
            <BarChart3 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Estadísticas
          </button>
          <button className={`tab-btn ${tab === 'resenas' ? 'active' : ''}`} onClick={() => setTab('resenas')}>
            <Star size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Reseñas ({resenas.length})
          </button>
        </div>

        {tab === 'canchas' && (
          canchas.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p>No tenés canchas registradas</p>
              <span><Link to="/panel/canchas/nueva" style={{ color: 'var(--green)' }}>Creá tu primera cancha</Link></span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {canchas.map(c => (
                <div key={c.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 'var(--radius)', flexShrink: 0,
                      background: c.fotos?.[0] ? `url(${c.fotos[0]}) center/cover` : c.foto_url ? `url(${c.foto_url}) center/cover` : 'linear-gradient(135deg,#16a34a22,#16a34a44)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {!c.fotos?.[0] && !c.foto_url && <span style={{ fontSize: 24 }}>⚽</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{c.nombre}</span>
                        <span className="badge badge-gray">{TIPO_LABEL[c.tipo] || c.tipo}</span>
                        {!c.activa && <span className="badge badge-red">Inactiva</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.direccion}</div>
                      <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>${Number(c.precio_hora).toLocaleString('es-AR')}/h</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <button onClick={() => toggleActiva(c)} className="btn btn-secondary btn-sm">
                        {c.activa ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span className="hide-mobile">{c.activa ? 'Desactivar' : 'Activar'}</span>
                      </button>
                      <Link to={`/panel/canchas/${c.id}/horarios`} className="btn btn-secondary btn-sm">
                        <Clock size={14} /><span className="hide-mobile">Horarios</span>
                      </Link>
                      <Link to={`/panel/canchas/${c.id}/editar`} className="btn btn-secondary btn-sm">
                        <Edit2 size={14} /><span className="hide-mobile">Editar</span>
                      </Link>
                      {confirmDelete === c.id ? (
                        <>
                          <button onClick={() => deleteCancha(c.id)} className="btn btn-danger btn-sm" disabled={deletingId === c.id}>
                            {deletingId === c.id ? '...' : '¿Eliminar?'}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary btn-sm">No</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(c.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'calendario' && (
          <CalendarView reservas={reservas} canchas={canchas} onRefresh={fetchData} />
        )}

        {tab === 'stats' && (
          <Estadisticas reservas={reservas} />
        )}

        {tab === 'resenas' && (
          <ResenasPanel resenas={resenas} onRefresh={fetchData} />
        )}

        {(tab === 'proximas' || tab === 'historial') && (
          <ReservasList
            reservas={tab === 'proximas' ? proximas : reservas.filter(r => r.fecha < hoy || r.estado === 'cancelada')}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  )
}

function msgConfirmacion(r, nombre) {
  const horaI = timeToHour(r.hora_inicio)
  const [y, m, d] = r.fecha.split('-')
  return `¡Hola ${nombre}! 🎉 Tu turno en *${r.canchas?.nombre}* quedó CONFIRMADO para el ${d}/${m}/${y} a las ${horaI}:00 hs. ¡Te esperamos! (cód. ${r.codigo})`
}

function ReservasList({ reservas, onRefresh }) {
  const [detalleId, setDetalleId] = useState(null)
  const [perfiles, setPerfiles] = useState({})
  const [accionando, setAccionando] = useState(null)
  const [avisar, setAvisar] = useState(null) // { reserva, nombre, telefono }

  async function verContacto(jugadorId) {
    if (!perfiles[jugadorId]) {
      const { data } = await supabase.rpc('get_contacto_jugador', { p_jugador_id: jugadorId })
      setPerfiles(p => ({ ...p, [jugadorId]: data?.[0] || { nombre: 'Jugador', telefono: null } }))
    }
    setDetalleId(jugadorId)
  }

  async function cambiarEstado(reserva, nuevoEstado) {
    setAccionando(reserva.id)
    await supabase.from('reservas').update({ estado: nuevoEstado }).eq('id', reserva.id)
    await notificar(nuevoEstado === 'confirmada' ? 'confirmada' : 'cancelada', reserva.id)
    // Al confirmar, ofrecemos avisar al jugador por WhatsApp con un toque
    if (nuevoEstado === 'confirmada') {
      const { data } = await supabase.rpc('get_contacto_jugador', { p_jugador_id: reserva.jugador_id })
      const p = data?.[0]
      if (p?.telefono) setAvisar({ reserva, nombre: p.nombre, telefono: p.telefono })
    }
    setAccionando(null)
    onRefresh()
  }

  function waLink(telefono, texto) {
    let num = (telefono || '').replace(/\D/g, '')
    if (num.startsWith('54')) num = num.slice(2)
    if (num.startsWith('9')) num = num.slice(1)
    return `https://wa.me/549${num}?text=${encodeURIComponent(texto)}`
  }

  if (!reservas.length) {
    return <div className="empty-state"><CalendarCheck size={48} /><p>Sin reservas</p></div>
  }

  return (
    <>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cancha</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Código</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.canchas?.nombre}</td>
                  <td>{r.fecha}</td>
                  <td>{timeToHour(r.hora_inicio)}:00 hs</td>
                  <td><span className={`badge ${ESTADO_BADGE[r.estado]}`}>{r.estado}</span></td>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{r.codigo}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {r.estado === 'pendiente' && (
                        <>
                          <button
                            onClick={() => cambiarEstado(r, 'confirmada')}
                            className="btn btn-sm"
                            disabled={accionando === r.id}
                            style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                          >
                            {accionando === r.id ? '...' : <><CheckCircle size={13} /> Confirmar</>}
                          </button>
                          <button
                            onClick={() => cambiarEstado(r, 'cancelada')}
                            className="btn btn-sm btn-danger"
                            disabled={accionando === r.id}
                          >
                            <XCircle size={13} /> Rechazar
                          </button>
                        </>
                      )}
                      <button onClick={() => verContacto(r.jugador_id)} className="btn btn-ghost btn-sm">
                        Contacto
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detalleId && perfiles[detalleId] && (() => {
        const p = perfiles[detalleId]
        const r = reservas.find(x => x.jugador_id === detalleId)
        const msg = r
          ? `Hola ${p.nombre}, te escribo de Canchas Tandil sobre tu reserva en ${r.canchas?.nombre} el ${r.fecha} a las ${timeToHour(r.hora_inicio)}:00 hs (cód. ${r.codigo}).`
          : `Hola ${p.nombre}, te escribo de Canchas Tandil.`
        return (
          <div className="modal-overlay" onClick={() => setDetalleId(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 340 }}>
              <div className="modal-header">
                <h3>Datos del jugador</h3>
                <button onClick={() => setDetalleId(null)} className="btn btn-ghost btn-sm">✕</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[['Nombre', p.nombre], ['Teléfono', p.telefono || 'No informado']].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
                {p.telefono && (
                  <a href={waLink(p.telefono, msg)} target="_blank" rel="noopener noreferrer"
                    className="btn btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', background: '#25d366', border: 'none' }}>
                    <MessageCircle size={15} /> Enviar WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Avisar al jugador que su turno fue confirmado */}
      {avisar && (
        <div className="modal-overlay" onClick={() => setAvisar(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>Reserva confirmada ✅</h3>
              <button onClick={() => setAvisar(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Avisale a <b>{avisar.nombre}</b> que su turno quedó confirmado. El mensaje ya está listo, solo tenés que tocar enviar:
              </p>
              <div style={{ fontSize: 13, background: 'var(--bg)', padding: 12, borderRadius: 'var(--radius)', border: '1px solid var(--border)', lineHeight: 1.5 }}>
                {msgConfirmacion(avisar.reserva, avisar.nombre)}
              </div>
              <a href={waLink(avisar.telefono, msgConfirmacion(avisar.reserva, avisar.nombre))} target="_blank" rel="noopener noreferrer"
                onClick={() => setTimeout(() => setAvisar(null), 400)}
                className="btn btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', background: '#25d366', border: 'none' }}>
                <MessageCircle size={16} /> Enviar por WhatsApp
              </a>
              <button onClick={() => setAvisar(null)} className="btn btn-ghost btn-sm">Ahora no</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const MESES_CAL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_CAL  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const ESTADO_COLOR = { pendiente: '#d97706', confirmada: '#16a34a', completada: '#6b7280' }

function CalendarView({ reservas, canchas, onRefresh }) {
  const ahora = new Date()
  const [cursor, setCursor] = useState({ year: ahora.getFullYear(), month: ahora.getMonth() })
  const [canchaFiltro, setCanchaFiltro] = useState('todas')
  const [diaSel, setDiaSel] = useState(null) // 'YYYY-MM-DD'

  const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-${String(ahora.getDate()).padStart(2,'0')}`

  // Agrupar reservas (sin canceladas) por fecha, aplicando filtro de cancha
  const porFecha = {}
  reservas.forEach(r => {
    if (r.estado === 'cancelada') return
    if (canchaFiltro !== 'todas' && r.cancha_id !== canchaFiltro) return
    ;(porFecha[r.fecha] ||= []).push(r)
  })

  // Construir celdas del mes (lunes primero)
  const offset = (new Date(cursor.year, cursor.month, 1).getDay() + 6) % 7
  const diasEnMes = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const celdas = [...Array(offset).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)]

  const fechaStr = d => `${cursor.year}-${String(cursor.month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const cambiarMes = delta => setCursor(c => {
    const nd = new Date(c.year, c.month + delta, 1)
    return { year: nd.getFullYear(), month: nd.getMonth() }
  })

  const totalMes = celdas.reduce((s, d) => d ? s + (porFecha[fechaStr(d)]?.length || 0) : s, 0)
  const reservasDiaSel = diaSel
    ? (porFecha[diaSel] || []).slice().sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    : []

  return (
    <div className="card" style={{ padding: 16 }}>
      {/* Header: navegación de mes + filtro de cancha */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => cambiarMes(-1)} className="btn btn-secondary btn-sm" aria-label="Mes anterior"><ChevronLeft size={16} /></button>
          <div style={{ fontWeight: 700, fontSize: 15, minWidth: 130, textAlign: 'center' }}>
            {MESES_CAL[cursor.month]} {cursor.year}
          </div>
          <button onClick={() => cambiarMes(1)} className="btn btn-secondary btn-sm" aria-label="Mes siguiente"><ChevronRight size={16} /></button>
          <button onClick={() => setCursor({ year: ahora.getFullYear(), month: ahora.getMonth() })} className="btn btn-ghost btn-sm">Hoy</button>
        </div>
        {canchas.length > 1 && (
          <select value={canchaFiltro} onChange={e => setCanchaFiltro(e.target.value)} className="form-input" style={{ width: 'auto', minWidth: 160, padding: '6px 10px', fontSize: 13 }}>
            <option value="todas">Todas las canchas</option>
            {canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
        {totalMes} turno{totalMes !== 1 ? 's' : ''} reservado{totalMes !== 1 ? 's' : ''} este mes
      </div>

      {/* Encabezado de días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DIAS_CAL.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Grilla del mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {celdas.map((d, i) => {
          if (!d) return <div key={`e${i}`} />
          const fs = fechaStr(d)
          const lista = porFecha[fs] || []
          const esHoy = fs === hoyStr
          const tienePendientes = lista.some(r => r.estado === 'pendiente')
          const clickable = lista.length > 0
          return (
            <button
              key={fs}
              onClick={() => clickable && setDiaSel(fs)}
              disabled={!clickable}
              style={{
                minHeight: 62, padding: '6px 4px', borderRadius: 'var(--radius)', textAlign: 'left',
                border: `1px solid ${esHoy ? 'var(--green)' : 'var(--border)'}`,
                background: lista.length ? (tienePendientes ? '#fffbeb' : 'var(--green-50)') : 'var(--card)',
                cursor: clickable ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: esHoy ? 800 : 500, alignSelf: 'flex-start',
                color: esHoy ? 'white' : 'var(--text)',
                background: esHoy ? 'var(--green)' : 'transparent',
                borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{d}</div>
              {lista.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                  {lista.slice(0, 4).map(r => (
                    <span key={r.id} style={{ width: 6, height: 6, borderRadius: '50%', background: ESTADO_COLOR[r.estado] || '#6b7280' }} />
                  ))}
                  {lista.length > 4 && <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>+{lista.length - 4}</span>}
                </div>
              )}
              {lista.length > 0 && (
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, marginTop: 'auto' }}>
                  {lista.length} turno{lista.length !== 1 ? 's' : ''}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ESTADO_COLOR.confirmada }} /> Confirmada
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ESTADO_COLOR.pendiente }} /> Pendiente
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ESTADO_COLOR.completada }} /> Completada
        </span>
      </div>

      {/* Detalle del día seleccionado */}
      {diaSel && (() => {
        const [y, m, d] = diaSel.split('-').map(Number)
        const fecha = new Date(y, m - 1, d)
        return (
          <div className="modal-overlay" onClick={() => setDiaSel(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
              <div className="modal-header">
                <h3>{DIAS_CAL[(fecha.getDay() + 6) % 7]} {d} de {MESES_CAL[m-1].toLowerCase()}</h3>
                <button onClick={() => setDiaSel(null)} className="btn btn-ghost btn-sm">✕</button>
              </div>
              <div className="modal-body" style={{ padding: reservasDiaSel.length ? 0 : 24 }}>
                {reservasDiaSel.length === 0
                  ? <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Sin turnos este día</div>
                  : <ReservasList reservas={reservasDiaSel} onRefresh={() => { onRefresh(); setDiaSel(null) }} />}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function Estadisticas({ reservas }) {
  const [exportando, setExportando] = useState(false)
  const activas = reservas.filter(r => r.estado !== 'cancelada')
  const canceladas = reservas.filter(r => r.estado === 'cancelada')
  const montoDe = r => Number(r.monto || r.canchas?.precio_hora || 0)

  // Ingresos de los últimos 6 meses
  const now = new Date()
  const meses = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    meses.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MESES_CAL[d.getMonth()].slice(0, 3) })
  }
  const ingresoMes = {}
  meses.forEach(m => { ingresoMes[m.key] = 0 })
  activas.forEach(r => { const k = r.fecha.slice(0, 7); if (k in ingresoMes) ingresoMes[k] += montoDe(r) })
  const maxIngreso = Math.max(1, ...meses.map(m => ingresoMes[m.key]))

  // Horarios más reservados
  const porHora = {}
  activas.forEach(r => { const h = timeToHour(r.hora_inicio); porHora[h] = (porHora[h] || 0) + 1 })
  const topHoras = Object.entries(porHora).map(([h, c]) => ({ h: Number(h), c })).sort((a, b) => b.c - a.c).slice(0, 6)
  const maxHora = Math.max(1, ...topHoras.map(t => t.c))

  // Ranking de canchas: alquileres, ingresos y desglose por mes
  const porCancha = {}
  activas.forEach(r => {
    const cid = r.cancha_id
    if (!porCancha[cid]) porCancha[cid] = { id: cid, nombre: r.canchas?.nombre || 'Cancha', count: 0, ingresos: 0, porMes: {} }
    porCancha[cid].count += 1
    porCancha[cid].ingresos += montoDe(r)
    const mk = r.fecha.slice(0, 7)
    porCancha[cid].porMes[mk] = (porCancha[cid].porMes[mk] || 0) + 1
  })
  const ranking = Object.values(porCancha).sort((a, b) => b.count - a.count)
  const maxCount = Math.max(1, ...ranking.map(c => c.count))

  const totalIngresos = activas.reduce((s, r) => s + montoDe(r), 0)
  const ticket = activas.length ? Math.round(totalIngresos / activas.length) : 0

  async function exportarExcel() {
    setExportando(true)
    try {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      const boldHeader = ws => { ws.getRow(1).font = { bold: true } }

      const s1 = wb.addWorksheet('Resumen')
      s1.addRow(['Métrica', 'Valor'])
      s1.addRow(['Reservados con éxito', activas.length])
      s1.addRow(['Dados de baja', canceladas.length])
      s1.addRow(['Ingresos totales', totalIngresos])
      s1.addRow(['Ticket promedio', ticket])
      s1.columns = [{ width: 22 }, { width: 16 }]
      boldHeader(s1)

      const s2 = wb.addWorksheet('Ingresos por mes')
      s2.addRow(['Mes', 'Ingresos'])
      meses.forEach(m => s2.addRow([m.label, ingresoMes[m.key]]))
      s2.columns = [{ width: 12 }, { width: 16 }]
      boldHeader(s2)

      const s3 = wb.addWorksheet('Por cancha')
      s3.addRow(['Cancha', 'Alquileres', 'Ingresos', ...meses.map(m => m.label)])
      ranking.forEach(c => s3.addRow([c.nombre, c.count, c.ingresos, ...meses.map(m => c.porMes[m.key] || 0)]))
      s3.columns = [{ width: 28 }, { width: 12 }, { width: 14 }, ...meses.map(() => ({ width: 8 }))]
      boldHeader(s3)

      const s4 = wb.addWorksheet('Reservas')
      s4.addRow(['Fecha', 'Cancha', 'Hora', 'Estado', 'Método de pago', 'Monto', 'Código'])
      reservas.forEach(r => s4.addRow([
        r.fecha, r.canchas?.nombre, `${timeToHour(r.hora_inicio)}:00`, r.estado, r.metodo_pago, montoDe(r), r.codigo,
      ]))
      s4.columns = [{ width: 12 }, { width: 26 }, { width: 8 }, { width: 12 }, { width: 16 }, { width: 12 }, { width: 12 }]
      boldHeader(s4)

      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `estadisticas-canchas-tandil-${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportando(false)
    }
  }

  if (!reservas.length) {
    return <div className="empty-state"><BarChart3 size={48} /><p>Sin datos todavía</p><span>Las estadísticas aparecen cuando tengas reservas</span></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={exportarExcel} className="btn btn-secondary btn-sm" disabled={exportando}>
          {exportando ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Download size={14} />}
          {exportando ? 'Generando...' : 'Descargar Excel'}
        </button>
      </div>

      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-label">Reservados con éxito</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{activas.length}</div>
          <div className="stat-sub">turnos</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Dados de baja</div>
          <div className="stat-value" style={{ color: 'var(--error)' }}>{canceladas.length}</div>
          <div className="stat-sub">{reservas.length > 0 ? `${Math.round((canceladas.length / reservas.length) * 100)}% del total` : 'turnos'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ingresos totales</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>${totalIngresos.toLocaleString('es-AR')}</div>
          <div className="stat-sub">estimado</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ticket promedio</div>
          <div className="stat-value">${ticket.toLocaleString('es-AR')}</div>
          <div className="stat-sub">por turno</div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Ranking de canchas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ranking.map((c, i) => (
            <div key={c.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: 'var(--muted)', marginRight: 6 }}>{i + 1}.</span>{c.nombre}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {c.count} {c.count === 1 ? 'alquiler' : 'alquileres'} · <b style={{ color: 'var(--green)' }}>${c.ingresos.toLocaleString('es-AR')}</b>
                </span>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                <div style={{ width: `${(c.count / maxCount) * 100}%`, background: 'var(--green)', height: '100%', borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Ingresos por mes</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 170 }}>
          {meses.map(m => {
            const v = ingresoMes[m.key]
            const hpct = (v / maxIngreso) * 100
            return (
              <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>{v > 0 ? `$${(v / 1000).toFixed(0)}k` : ''}</div>
                <div style={{ width: '100%', maxWidth: 44, height: `${Math.max(hpct, 2)}%`, background: 'var(--green)', borderRadius: '6px 6px 0 0' }} title={`$${v.toLocaleString('es-AR')}`} />
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{m.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Alquileres por mes por cancha</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cancha</th>
                {meses.map(m => <th key={m.key} style={{ textAlign: 'center', textTransform: 'capitalize' }}>{m.label}</th>)}
                <th style={{ textAlign: 'center' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(c => {
                const totalMeses = meses.reduce((s, m) => s + (c.porMes[m.key] || 0), 0)
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                    {meses.map(m => <td key={m.key} style={{ textAlign: 'center' }}>{c.porMes[m.key] || 0}</td>)}
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{totalMeses}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Horarios más reservados</h3>
        {topHoras.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Sin datos</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topHoras.map(t => (
              <div key={t.h} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 54, fontSize: 13, fontWeight: 600 }}>{t.h}:00</div>
                <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 99, height: 14, overflow: 'hidden' }}>
                  <div style={{ width: `${(t.c / maxHora) * 100}%`, background: 'var(--green)', height: '100%', borderRadius: 99 }} />
                </div>
                <div style={{ width: 30, fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>{t.c}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ResenasPanel({ resenas, onRefresh }) {
  const [editId, setEditId] = useState(null)
  const [texto, setTexto] = useState('')
  const [guardando, setGuardando] = useState(false)

  function abrir(r) { setEditId(r.id); setTexto(r.respuesta || '') }

  async function guardar(r, valor) {
    setGuardando(true)
    await supabase.rpc('responder_resena', { p_resena_id: r.id, p_respuesta: valor })
    setGuardando(false); setEditId(null); setTexto(''); onRefresh()
  }

  if (!resenas.length) {
    return <div className="empty-state"><Star size={48} /><p>Todavía no tenés reseñas</p><span>Aparecen acá cuando un jugador califica una cancha tuya</span></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {resenas.map(r => (
        <div key={r.id} className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{r.perfiles?.nombre ?? 'Jugador'}</span>
              <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 8 }}>{r.canchas?.nombre}</span>
            </div>
            <StarRating value={r.puntuacion} readOnly size={15} />
          </div>
          {r.comentario && <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5, margin: '0 0 6px' }}>{r.comentario}</p>}
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(r.created_at).toLocaleDateString('es-AR')}</span>

          {editId === r.id ? (
            <div style={{ marginTop: 10 }}>
              <textarea className="form-textarea" rows={2} placeholder="Escribí tu respuesta..." value={texto} onChange={e => setTexto(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => guardar(r, texto)} className="btn btn-primary btn-sm" disabled={guardando || !texto.trim()}>
                  {guardando ? 'Guardando...' : 'Publicar respuesta'}
                </button>
                <button onClick={() => { setEditId(null); setTexto('') }} className="btn btn-secondary btn-sm">Cancelar</button>
              </div>
            </div>
          ) : r.respuesta ? (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--green-50)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--green)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 2 }}>Tu respuesta</div>
              <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5, margin: '0 0 6px' }}>{r.respuesta}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => abrir(r)} className="btn btn-ghost btn-sm">Editar</button>
                <button onClick={() => guardar(r, '')} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} disabled={guardando}>Eliminar</button>
              </div>
            </div>
          ) : (
            <div>
              <button onClick={() => abrir(r)} className="btn btn-secondary btn-sm" style={{ marginTop: 10 }}>
                <MessageSquare size={14} /> Responder
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
