import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Save, Lock, Trash2 } from 'lucide-react'
import { timeToHour, hourToTime } from '../lib/tipoCancha'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const HORAS = Array.from({ length: 15 }, (_, i) => i + 8) // 8 a 22
const hoyStr = () => new Date().toISOString().split('T')[0]
const fmtFecha = f => new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

export default function ManageSchedulePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cancha, setCancha] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [bloqueos, setBloqueos] = useState([])
  const [loading, setLoading] = useState(true)

  // Form de bloqueos
  const [bloqFecha, setBloqFecha] = useState('')
  const [bloqTodoDia, setBloqTodoDia] = useState(true)
  const [bloqHoras, setBloqHoras] = useState(new Set())
  const [guardandoBloq, setGuardandoBloq] = useState(false)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    const [{ data: c }, { data: h }, { data: b }] = await Promise.all([
      supabase.from('canchas').select('nombre').eq('id', id).eq('dueno_id', user.id).single(),
      supabase.from('horarios').select('*').eq('cancha_id', id),
      supabase.from('bloqueos').select('*').eq('cancha_id', id).gte('fecha', hoyStr()).order('fecha'),
    ])
    if (!c) { navigate('/panel'); return }
    setCancha(c)
    setHorarios(h || [])
    setBloqueos(b || [])
    setLoading(false)
  }

  function toggleBloqHora(h) {
    setBloqHoras(s => { const n = new Set(s); n.has(h) ? n.delete(h) : n.add(h); return n })
  }

  async function agregarBloqueo() {
    if (!bloqFecha) return
    setGuardandoBloq(true)
    const filas = bloqTodoDia
      ? [{ cancha_id: id, fecha: bloqFecha, hora_inicio: null }]
      : [...bloqHoras].map(h => ({ cancha_id: id, fecha: bloqFecha, hora_inicio: hourToTime(h) }))
    if (filas.length) await supabase.from('bloqueos').insert(filas)
    setGuardandoBloq(false)
    setBloqFecha(''); setBloqHoras(new Set()); setBloqTodoDia(true)
    fetchData()
  }

  async function quitarBloqueoFecha(items) {
    await supabase.from('bloqueos').delete().in('id', items.map(i => i.id))
    fetchData()
  }

  function getSlot(dia, hora) {
    const hi = hourToTime(hora)
    return horarios.find(h => h.dia_semana === dia && h.hora_inicio === hi)
  }

  function isActivo(dia, hora) {
    return getSlot(dia, hora)?.activo ?? false
  }

  async function toggleSlot(dia, hora) {
    const existente = getSlot(dia, hora)
    if (existente) {
      const { data } = await supabase.from('horarios').update({ activo: !existente.activo }).eq('id', existente.id).select().single()
      setHorarios(h => h.map(x => x.id === data.id ? data : x))
    } else {
      const { data } = await supabase.from('horarios').insert({
        cancha_id: id, dia_semana: dia,
        hora_inicio: hourToTime(hora), hora_fin: hourToTime(hora + 1), activo: true,
      }).select().single()
      setHorarios(h => [...h, data])
    }
  }

  async function toggleDia(dia) {
    const target = !HORAS.some(h => isActivo(dia, h))
    const existentes = horarios.filter(h => h.dia_semana === dia)
    if (existentes.length) await supabase.from('horarios').update({ activo: target }).in('id', existentes.map(h => h.id))
    if (target) {
      const faltantes = HORAS.filter(h => !existentes.some(e => e.hora_inicio === hourToTime(h)))
        .map(h => ({ cancha_id: id, dia_semana: dia, hora_inicio: hourToTime(h), hora_fin: hourToTime(h + 1), activo: true }))
      if (faltantes.length) await supabase.from('horarios').insert(faltantes)
    }
    fetchData()
  }

  async function toggleHora(hora) {
    const target = !DIAS.some((_, dia) => isActivo(dia, hora))
    const existentes = horarios.filter(h => h.hora_inicio === hourToTime(hora))
    if (existentes.length) await supabase.from('horarios').update({ activo: target }).in('id', existentes.map(h => h.id))
    if (target) {
      const faltantes = DIAS.map((_, dia) => dia).filter(dia => !existentes.some(e => e.dia_semana === dia))
        .map(dia => ({ cancha_id: id, dia_semana: dia, hora_inicio: hourToTime(hora), hora_fin: hourToTime(hora + 1), activo: true }))
      if (faltantes.length) await supabase.from('horarios').insert(faltantes)
    }
    fetchData()
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <button onClick={() => navigate('/panel')} className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Gestión de horarios</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{cancha.nombre}</p>
          </div>
        </div>

        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Clic en una celda para activar/desactivar ese horario. Clic en el encabezado del día u hora para activar/desactivar toda la columna o fila.
        </div>

        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table style={{ minWidth: 500 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'center', paddingLeft: 16 }}>Hora</th>
                {DIAS.map((dia, diaIdx) => (
                  <th key={dia} style={{ textAlign: 'center' }}>
                    <button onClick={() => toggleDia(diaIdx)} className="btn btn-ghost btn-sm" style={{ fontSize: 12, fontWeight: 600 }}>{dia}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORAS.map(hora => (
                <tr key={hora}>
                  <td style={{ textAlign: 'center', paddingLeft: 16 }}>
                    <button onClick={() => toggleHora(hora)} className="btn btn-ghost btn-sm" style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
                      {hora}:00
                    </button>
                  </td>
                  {DIAS.map((_, diaIdx) => {
                    const activo = isActivo(diaIdx, hora)
                    return (
                      <td key={diaIdx} style={{ textAlign: 'center', padding: '6px 8px' }}>
                        <button
                          onClick={() => toggleSlot(diaIdx, hora)}
                          style={{
                            width: 32, height: 32, borderRadius: 6, cursor: 'pointer', transition: 'all 0.12s',
                            border: activo ? '2px solid #86efac' : '1px solid var(--border)',
                            background: activo ? 'var(--green)' : '#f1f5f9',
                          }}
                          title={`${DIAS[diaIdx]} ${hora}:00 - ${activo ? 'activo' : 'inactivo'}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--green)', display: 'inline-block' }} /> Activo
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: '#f1f5f9', border: '1px solid var(--border)', display: 'inline-block' }} /> Inactivo
            </span>
          </div>
        </div>

        {/* Cerrar fechas puntuales */}
        <div className="card" style={{ padding: 20, marginTop: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={15} /> Cerrar fechas puntuales
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
            Bloqueá un día entero o ciertas horas (feriado, torneo, mantenimiento). No afecta tu grilla semanal.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Fecha</label>
              <input type="date" className="form-input" min={hoyStr()} value={bloqFecha} onChange={e => setBloqFecha(e.target.value)} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', paddingBottom: 8 }}>
              <input type="checkbox" checked={bloqTodoDia} onChange={e => setBloqTodoDia(e.target.checked)} /> Todo el día
            </label>
          </div>

          {!bloqTodoDia && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Elegí las horas a cerrar:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {HORAS.map(h => (
                  <button key={h} type="button" onClick={() => toggleBloqHora(h)}
                    className={`btn btn-sm ${bloqHoras.has(h) ? 'btn-primary' : 'btn-secondary'}`}>
                    {h}:00
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={agregarBloqueo} className="btn btn-danger" style={{ marginTop: 14 }}
            disabled={guardandoBloq || !bloqFecha || (!bloqTodoDia && bloqHoras.size === 0)}>
            <Lock size={14} /> {guardandoBloq ? 'Cerrando...' : 'Cerrar fecha'}
          </button>

          {bloqueos.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Fechas cerradas próximas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(bloqueos.reduce((acc, b) => { (acc[b.fecha] ||= []).push(b); return acc }, {})).map(([fecha, items]) => (
                  <div key={fecha} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13 }}>
                      <b style={{ textTransform: 'capitalize' }}>{fmtFecha(fecha)}</b>{' '}
                      <span style={{ color: 'var(--muted)' }}>
                        {items.some(i => i.hora_inicio === null)
                          ? '· todo el día'
                          : '· ' + items.map(i => timeToHour(i.hora_inicio) + 'h').sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}
                      </span>
                    </div>
                    <button onClick={() => quitarBloqueoFecha(items)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} title="Quitar bloqueo">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', marginTop: 16 }}>
          <button onClick={() => navigate('/panel')} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
            <Save size={14} /> Listo
          </button>
        </div>
      </div>
    </div>
  )
}
