import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { timeToHour } from '../lib/tipoCancha'

const HORAS = Array.from({ length: 16 }, (_, i) => i + 8) // 8 a 23 (slots de 1h, el último termina a las 24)

export default function TimeSlotGrid({ canchaId, fecha, diaHorarios, onSelect, selectedHora }) {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!canchaId || !fecha) return
    setLoading(true)
    fetchReservas()

    const channel = supabase
      .channel(`slots-${canchaId}-${fecha}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'reservas',
        filter: `cancha_id=eq.${canchaId}`,
      }, () => fetchReservas())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [canchaId, fecha])

  async function fetchReservas() {
    // RPC segura: devuelve solo las horas ocupadas, sin exponer datos personales
    const { data } = await supabase.rpc('horas_ocupadas', { p_cancha_id: canchaId, p_fecha: fecha })
    setReservas(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="slot-grid">
        {HORAS.map(h => <div key={h} className="skeleton" style={{ height: 54 }} />)}
      </div>
    )
  }

  const reservadasHoras = new Set(reservas.map(r => timeToHour(r.hora_inicio)))

  // diaHorarios: slots activos del día actual
  const diaIdx = new Date(fecha + 'T00:00:00').getDay()
  const horariosActivosHoras = new Set(
    diaHorarios
      .filter(h => h.dia_semana === diaIdx && h.activo)
      .map(h => timeToHour(h.hora_inicio))
  )

  // Si la fecha es hoy, las horas que ya pasaron no se pueden reservar
  const ahora = new Date()
  const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-${String(ahora.getDate()).padStart(2,'0')}`
  const esHoy = fecha === hoyStr

  return (
    <div className="slot-grid">
      {HORAS.map(hora => {
        const ocupado = reservadasHoras.has(hora)
        const disponible = horariosActivosHoras.has(hora)
        const seleccionado = selectedHora === hora
        const pasado = esHoy && hora <= ahora.getHours()

        if (pasado)       return <Slot key={hora} hora={hora} estado="pasado" />
        if (!disponible)  return <Slot key={hora} hora={hora} estado="cerrado" />
        if (ocupado)      return <Slot key={hora} hora={hora} estado="ocupado" />

        return (
          <Slot
            key={hora}
            hora={hora}
            estado={seleccionado ? 'seleccionado' : 'libre'}
            onClick={() => onSelect(hora)}
          />
        )
      })}
    </div>
  )
}

const ETIQUETA = {
  libre: 'Libre',
  seleccionado: 'Elegido',
  ocupado: 'Reservado',
  pasado: 'Pasó',
  cerrado: 'Cerrado',
}

function Slot({ hora, estado, onClick }) {
  const interactivo = estado === 'libre' || estado === 'seleccionado'
  const Tag = interactivo ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      disabled={interactivo ? undefined : true}
      title={ETIQUETA[estado]}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        padding: '9px 4px',
        borderRadius: 'var(--radius)',
        border: '1px solid',
        textAlign: 'center',
        transition: 'all .15s',
        cursor: interactivo ? 'pointer' : 'not-allowed',
        fontFamily: 'var(--font-mono-caps)',
        ...estilo(estado),
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>{hora}:00</span>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.75 }}>
        {ETIQUETA[estado]}
      </span>
    </Tag>
  )
}

function estilo(estado) {
  switch (estado) {
    case 'seleccionado':
      return {
        background: 'var(--green)',
        borderColor: 'var(--green)',
        color: 'var(--cta-text)',
        boxShadow: '0 0 0 3px color-mix(in srgb, var(--green) 25%, transparent)',
      }
    case 'libre':
      return {
        background: 'var(--green-50)',
        borderColor: 'color-mix(in srgb, var(--green) 45%, transparent)',
        color: 'var(--green)',
      }
    case 'ocupado':
      return {
        background: 'var(--surface-2)',
        borderColor: 'var(--border)',
        color: 'var(--muted)',
        textDecoration: 'line-through',
      }
    case 'pasado':
      return {
        background: 'transparent',
        borderColor: 'var(--border)',
        color: 'var(--muted)',
        opacity: 0.45,
      }
    default: // cerrado
      return {
        background: 'transparent',
        borderColor: 'var(--border)',
        borderStyle: 'dashed',
        color: 'var(--muted)',
        opacity: 0.6,
      }
  }
}
