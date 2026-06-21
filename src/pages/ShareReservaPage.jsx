import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TIPO_LABEL, timeToHour } from '../lib/tipoCancha'
import { MapPin, Clock, Calendar, Copy, CheckCircle } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const ESTADO_COLOR = { pendiente: '#d97706', confirmada: '#16a34a', cancelada: '#dc2626', completada: '#6b7280' }

export default function ShareReservaPage() {
  const { codigo } = useParams()
  const [reserva, setReserva] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)

  useSEO({
    title: reserva ? `Reserva en ${reserva.canchas?.nombre}` : `Turno ${codigo}`,
    description: reserva ? `Turno en ${reserva.canchas?.nombre}, ${reserva.canchas?.direccion}. Código: ${codigo}.` : undefined,
  })
  useEffect(() => {
    supabase
      .from('reservas')
      .select('*, canchas(nombre, direccion, tipo, maps_url, latitud, longitud)')
      .eq('codigo', codigo)
      .single()
      .then(({ data }) => { setReserva(data); setLoading(false) })
  }, [codigo])

  function copiarLink() {
    navigator.clipboard?.writeText(window.location.href)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  if (!reserva) return (
    <div className="page"><div className="container" style={{ textAlign: 'center', paddingTop: 64 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Reserva no encontrada</h1>
      <p style={{ color: 'var(--muted)', marginTop: 8 }}>El código <code>{codigo}</code> no existe.</p>
      <a href="/" className="btn btn-primary" style={{ marginTop: 20 }}>Ver canchas</a>
    </div></div>
  )

  const [y, m, d] = reserva.fecha.split('-').map(Number)
  const fecha = new Date(y, m - 1, d)
  const horaI = timeToHour(reserva.hora_inicio)
  const horaF = timeToHour(reserva.hora_fin)
  const cancha = reserva.canchas
  const mapsUrl = cancha.maps_url
    || (cancha.latitud ? `https://maps.google.com/?q=${cancha.latitud},${cancha.longitud}` : null)
    || `https://www.google.com/maps/search/${encodeURIComponent(cancha.direccion + ' Tandil Buenos Aires')}`

  return (
    <div className="page" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 480, paddingTop: 32, paddingBottom: 48 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 40 }}>⚽</span>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Canchas Tandil — Turno compartido</p>
        </div>

        {/* Ticket */}
        <div className="card" style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
          {/* Header verde */}
          <div style={{ background: 'var(--green)', padding: '24px 24px 20px', color: 'white' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, marginBottom: 6 }}>
              {TIPO_LABEL[cancha.tipo] || cancha.tipo}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{cancha.nombre}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.9 }}>
              <MapPin size={13} />{cancha.direccion}
            </div>
          </div>

          {/* Separador dentado */}
          <div style={{ height: 20, background: `radial-gradient(circle at 50% 0%, var(--bg) 10px, var(--green) 10px)`, backgroundSize: '24px 20px' }} />

          {/* Cuerpo del ticket */}
          <div style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={11} /> Fecha
                </div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{DIAS[fecha.getDay()]}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{d} de {MESES[m-1]} de {y}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} /> Horario
                </div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{horaI}:00 – {horaF}:00 hs</div>
              </div>
            </div>

            <div style={{ borderTop: '2px dashed var(--border-dark)', paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Código de reserva</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--green-dark)' }}>
                  {reserva.codigo}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                  background: ESTADO_COLOR[reserva.estado] + '20',
                  color: ESTADO_COLOR[reserva.estado],
                  border: `1px solid ${ESTADO_COLOR[reserva.estado]}40`,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {reserva.estado}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          <button onClick={copiarLink} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            {copiado ? <><CheckCircle size={15} /> ¡Link copiado!</> : <><Copy size={15} /> Copiar link de este turno</>}
          </button>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-ghost" style={{ textDecoration: 'none', justifyContent: 'center', width: '100%' }}>
            <MapPin size={15} /> Ver en Google Maps
          </a>
          <a href="/" className="btn btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', width: '100%' }}>
            Reservar mi turno
          </a>
        </div>
      </div>
    </div>
  )
}
