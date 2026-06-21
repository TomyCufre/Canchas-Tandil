import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TIPO_LABEL, timeToHour } from '../lib/tipoCancha'
import { Plus, Edit2, Trash2, Eye, EyeOff, Clock, CalendarCheck, CheckCircle, XCircle, MessageCircle } from 'lucide-react'
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
    const [{ data: cs }, { data: rs }] = await Promise.all([
      supabase.from('canchas').select('*').eq('dueno_id', user.id).order('created_at', { ascending: false }),
      supabase.from('reservas')
        .select('*, canchas!inner(nombre, dueno_id, precio_hora)')
        .eq('canchas.dueno_id', user.id)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false })
        .limit(200),
    ])
    setCanchas(cs || [])
    setReservas(rs || [])
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

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

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
          <button className={`tab-btn ${tab === 'proximas' ? 'active' : ''}`} onClick={() => setTab('proximas')}>
            Próximas ({proximas.length})
            {pendientes.length > 0 && <span className="badge badge-yellow" style={{ marginLeft: 6 }}>{pendientes.length}</span>}
          </button>
          <button className={`tab-btn ${tab === 'historial' ? 'active' : ''}`} onClick={() => setTab('historial')}>Historial</button>
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

function ReservasList({ reservas, onRefresh }) {
  const [detalleId, setDetalleId] = useState(null)
  const [perfiles, setPerfiles] = useState({})
  const [accionando, setAccionando] = useState(null)

  async function verContacto(jugadorId) {
    if (!perfiles[jugadorId]) {
      const { data } = await supabase.from('perfiles').select('nombre, telefono').eq('id', jugadorId).single()
      setPerfiles(p => ({ ...p, [jugadorId]: data }))
    }
    setDetalleId(jugadorId)
  }

  async function cambiarEstado(reserva, nuevoEstado) {
    setAccionando(reserva.id)
    await supabase.from('reservas').update({ estado: nuevoEstado }).eq('id', reserva.id)
    await notificar(nuevoEstado === 'confirmada' ? 'confirmada' : 'cancelada', reserva.id)
    setAccionando(null)
    onRefresh()
  }

  function waLink(telefono, texto) {
    const num = telefono.replace(/\D/g, '')
    return `https://wa.me/54${num}?text=${encodeURIComponent(texto)}`
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
    </>
  )
}
