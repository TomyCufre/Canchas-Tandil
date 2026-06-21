import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { timeToHour, hourToTime } from '../lib/tipoCancha'

const HORAS = Array.from({ length: 15 }, (_, i) => i + 8) // 8 a 22 (slots de 1h, terminan a las 23)

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
    const { data } = await supabase
      .from('reservas')
      .select('hora_inicio, estado')
      .eq('cancha_id', canchaId)
      .eq('fecha', fecha)
      .neq('estado', 'cancelada')
    setReservas(data || [])
    setLoading(false)
  }

  if (loading) {
    return <div className="loading-center" style={{ padding: 20 }}><div className="spinner" style={{ width: 24, height: 24 }} /></div>
  }

  const reservadasHoras = new Set(reservas.map(r => timeToHour(r.hora_inicio)))

  // diaHorarios: slots activos del día actual
  const diaIdx = new Date(fecha + 'T00:00:00').getDay()
  const horariosActivosHoras = new Set(
    diaHorarios
      .filter(h => h.dia_semana === diaIdx && h.activo)
      .map(h => timeToHour(h.hora_inicio))
  )

  return (
    <div className="slot-grid">
      {HORAS.map(hora => {
        const ocupado = reservadasHoras.has(hora)
        const disponible = horariosActivosHoras.has(hora)
        const seleccionado = selectedHora === hora

        if (!disponible) {
          return (
            <div key={hora} style={slotStyle('disabled')} title="No disponible">
              <span>{hora}:00</span>
            </div>
          )
        }

        return (
          <button
            key={hora}
            onClick={() => !ocupado && onSelect(hora)}
            disabled={ocupado}
            style={slotStyle(ocupado ? 'ocupado' : seleccionado ? 'selected' : 'libre')}
            title={ocupado ? 'Ocupado' : 'Disponible'}
          >
            {hora}:00
          </button>
        )
      })}
    </div>
  )
}

function slotStyle(estado) {
  const base = {
    padding: '10px 4px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500,
    border: '1px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
  }
  switch (estado) {
    case 'libre':    return { ...base, background: 'var(--green-50)', borderColor: '#86efac', color: 'var(--green-dark)' }
    case 'ocupado':  return { ...base, background: '#f1f5f9', borderColor: 'var(--border)', color: 'var(--muted)', cursor: 'not-allowed', textDecoration: 'line-through' }
    case 'selected': return { ...base, background: 'var(--green)', borderColor: 'var(--green-dark)', color: 'white' }
    case 'disabled': return { ...base, background: '#fafafa', borderColor: 'var(--border)', color: '#d1d5db', cursor: 'not-allowed', borderStyle: 'dashed' }
    default: return base
  }
}
