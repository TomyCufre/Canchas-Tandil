import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TIPO_LABEL, hourToTime, timeToHour } from '../lib/tipoCancha'
import PhotoGallery from '../components/PhotoGallery'
import TimeSlotGrid from '../components/TimeSlotGrid'
import { MapPin, Clock, CreditCard, Car, Lightbulb, ShirtIcon, X, CheckCircle, Copy, ExternalLink, MessageCircle, Star } from 'lucide-react'
import StarRating from '../components/StarRating'
import { useSEO } from '../hooks/useSEO'

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const MESES_LARGO = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function getFechasDisponibles() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d
  })
}

function formatFecha(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export default function CourtDetailPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [cancha, setCancha] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)

  const fechas = getFechasDisponibles()
  const [fechaIdx, setFechaIdx] = useState(0)
  const [horaSeleccionada, setHoraSeleccionada] = useState(null)
  const [modal, setModal] = useState(null)
  const [metodoPago, setMetodoPago] = useState('presencial')
  const [reservando, setReservando] = useState(false)
  const [reservaCreada, setReservaCreada] = useState(null)
  const [errorReserva, setErrorReserva] = useState('')

  useSEO({
    title: cancha ? `${cancha.nombre} — Reservar turno` : 'Reservar cancha',
    description: cancha ? `Reservá turno en ${cancha.nombre}. ${cancha.direccion}. Fútbol en Tandil.` : undefined,
  })
  useEffect(() => { fetchCancha() }, [id])

  async function fetchCancha() {
    const [{ data: c }, { data: h }, { data: rs }] = await Promise.all([
      supabase.from('canchas').select('*').eq('id', id).single(),
      supabase.from('horarios').select('*').eq('cancha_id', id),
      supabase.from('resenas').select('*, perfiles(nombre, avatar_url)').eq('cancha_id', id).order('created_at', { ascending: false }),
    ])
    setCancha(c)
    setHorarios(h || [])
    setResenas(rs || [])
    if (c?.acepta_presencial) setMetodoPago('presencial')
    else if (c?.acepta_online) setMetodoPago('mercadopago')
    setLoading(false)
  }

  function handleSelectHora(hora) {
    if (!user) { navigate('/login'); return }
    setHoraSeleccionada(hora)
    setModal('booking')
    setErrorReserva('')
  }

  async function confirmarReserva() {
    setReservando(true)
    setErrorReserva('')
    const fecha = formatFecha(fechas[fechaIdx])
    const hora_inicio = hourToTime(horaSeleccionada)
    const hora_fin   = hourToTime(horaSeleccionada + 1)

    const { data, error } = await supabase.from('reservas').insert({
      cancha_id: id,
      jugador_id: user.id,
      fecha,
      hora_inicio,
      hora_fin,
      metodo_pago: metodoPago,
      monto: cancha.precio_hora,
      estado: 'pendiente',
    }).select().single()

    setReservando(false)
    if (error) {
      setErrorReserva(
        error.code === '23505'
          ? 'Ese turno ya fue reservado. Elegí otro horario.'
          : `Error al reservar: ${error.message}`
      )
    } else {
      setReservaCreada(data)
      setModal('success')
      setHoraSeleccionada(null)
      // Notificar al dueño por email (silencioso)
      supabase.functions.invoke('notify-reserva', { body: { tipo: 'nueva_reserva', reserva_id: data.id } }).catch(() => {})
    }
  }

  function waCompartir(reserva) {
    const horaI = timeToHour(reserva.hora_inicio)
    const horaF = timeToHour(reserva.hora_fin)
    const [y, m, d] = reserva.fecha.split('-')
    const msg = `⚽ Reservé cancha en *${cancha.nombre}*\n📅 ${d}/${m}/${y}\n🕐 ${horaI}:00 – ${horaF}:00 hs\n📍 ${cancha.direccion}\n🎫 Código: ${reserva.codigo}`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!cancha) return <div className="page"><div className="container"><div className="alert alert-error">Cancha no encontrada.</div></div></div>

  const fotos = cancha.fotos?.length ? cancha.fotos : (cancha.foto_url ? [cancha.foto_url] : [])
  const fechaActual = fechas[fechaIdx]
  const tipoLabel = TIPO_LABEL[cancha.tipo] || cancha.tipo

  const mapsUrl = cancha.maps_url
    || (cancha.latitud && cancha.longitud
        ? `https://www.google.com/maps?q=${cancha.latitud},${cancha.longitud}`
        : `https://www.google.com/maps/search/${encodeURIComponent(cancha.direccion + ' Tandil Buenos Aires')}`)

  const mapsEmbed = cancha.latitud && cancha.longitud
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${cancha.longitud - 0.005},${cancha.latitud - 0.005},${cancha.longitud + 0.005},${cancha.latitud + 0.005}&layer=mapnik&marker=${cancha.latitud},${cancha.longitud}`
    : null

  const metodosPago = []
  if (cancha.acepta_presencial) metodosPago.push('presencial')
  if (cancha.acepta_online) metodosPago.push('mercadopago')

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>

          <div className="court-detail-grid">
            <div>
              <PhotoGallery fotos={fotos} />
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 700 }}>{cancha.nombre}</h1>
                  <span className="badge badge-green" style={{ fontSize: 13 }}>{tipoLabel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
                  <MapPin size={14} /><span>{cancha.direccion}</span>
                </div>
                {cancha.descripcion && (
                  <p style={{ color: 'var(--text-light)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{cancha.descripcion}</p>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  {cancha.tiene_vestuario      && <div style={chip}><ShirtIcon size={13} /> Vestuario</div>}
                  {cancha.tiene_estacionamiento && <div style={chip}><Car size={13} /> Estacionamiento</div>}
                  {cancha.tiene_iluminacion     && <div style={chip}><Lightbulb size={13} /> Iluminación</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {cancha.acepta_presencial && <div style={{ ...chip, background: '#eff6ff', color: '#1d4ed8' }}><CreditCard size={13} /> Pago en el lugar</div>}
                  {cancha.acepta_online     && <div style={{ ...chip, background: '#eff6ff', color: '#1d4ed8' }}><CreditCard size={13} /> Mercado Pago</div>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 4 }}>Precio por hora</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)' }}>
                  ${Number(cancha.precio_hora).toLocaleString('es-AR')}
                </div>
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                {mapsEmbed ? (
                  <iframe src={mapsEmbed} width="100%" height="200" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy" title="Ubicación" />
                ) : (
                  <div style={{ height: 160, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <MapPin size={32} style={{ color: 'var(--muted)' }} />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sin coordenadas — agregá el link de Google Maps en el panel</span>
                  </div>
                )}
                <div style={{ padding: '10px 14px' }}>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--info,#3b82f6)', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                    <ExternalLink size={13} /> Abrir en Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Reseñas */}
          {resenas.length > 0 && (() => {
            const prom = (resenas.reduce((s, r) => s + r.puntuacion, 0) / resenas.length).toFixed(1)
            return (
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <Star size={18} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                  <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                    {prom} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 14 }}>({resenas.length} reseña{resenas.length !== 1 ? 's' : ''})</span>
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {resenas.map(r => (
                    <div key={r.id} style={{ display: 'flex', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: r.perfiles?.avatar_url ? `url(${r.perfiles.avatar_url}) center/cover` : 'var(--green-50)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, border: '1px solid var(--border)',
                      }}>
                        {!r.perfiles?.avatar_url && '👤'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{r.perfiles?.nombre ?? 'Jugador'}</span>
                          <StarRating value={r.puntuacion} readOnly size={14} />
                        </div>
                        {r.comentario && <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5, margin: 0 }}>{r.comentario}</p>}
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(r.created_at).toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Reservas */}
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              <Clock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              Seleccioná un turno
            </h2>

            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
              {fechas.map((fecha, idx) => (
                <button key={idx} onClick={() => { setFechaIdx(idx); setHoraSeleccionada(null) }} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '8px 14px', borderRadius: 'var(--radius)',
                  border: `2px solid ${fechaIdx === idx ? 'var(--green)' : 'var(--border-dark)'}`,
                  background: fechaIdx === idx ? 'var(--green-50)' : 'var(--card)',
                  cursor: 'pointer', flexShrink: 0, minWidth: 52,
                  color: fechaIdx === idx ? 'var(--green-dark)' : 'var(--text)',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', opacity: 0.7 }}>{DIAS_SEMANA[fecha.getDay()]}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{fecha.getDate()}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{MESES[fecha.getMonth()]}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12, color: 'var(--muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--green-50)', border: '1px solid #86efac', display: 'inline-block' }} /> Disponible
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: '#f1f5f9', border: '1px solid var(--border)', display: 'inline-block' }} /> Ocupado
              </span>
            </div>

            <TimeSlotGrid
              canchaId={id}
              fecha={formatFecha(fechaActual)}
              diaHorarios={horarios}
              onSelect={handleSelectHora}
              selectedHora={horaSeleccionada}
            />

            {!user && (
              <p style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                <a href="/login" style={{ color: 'var(--green)', fontWeight: 500 }}>Iniciá sesión</a> para reservar un turno
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal reserva */}
      {modal === 'booking' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar reserva</h3>
              <button onClick={() => setModal(null)} className="btn btn-ghost btn-sm"><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Cancha', value: cancha.nombre },
                  { label: 'Fecha', value: `${DIAS_SEMANA[fechaActual.getDay()]} ${fechaActual.getDate()} de ${MESES_LARGO[fechaActual.getMonth()]}` },
                  { label: 'Horario', value: `${horaSeleccionada}:00 – ${horaSeleccionada+1}:00 hs` },
                  { label: 'Precio', value: `$${Number(cancha.precio_hora).toLocaleString('es-AR')}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}

                {metodosPago.length > 0 && (
                  <>
                    <div className="divider" />
                    <div className="form-group">
                      <label className="form-label">Método de pago</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {metodosPago.map(m => (
                          <label key={m} style={{
                            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                            border: `2px solid ${metodoPago === m ? 'var(--green)' : 'var(--border-dark)'}`,
                            borderRadius: 'var(--radius)', padding: '10px 12px',
                            background: metodoPago === m ? 'var(--green-50)' : 'var(--card)', transition: 'all 0.15s',
                          }}>
                            <input type="radio" name="pago" value={m} checked={metodoPago === m} onChange={() => setMetodoPago(m)} />
                            <span style={{ fontSize: 18 }}>{m === 'presencial' ? '💵' : '💳'}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{m === 'presencial' ? 'Pago en el lugar' : 'Mercado Pago'}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m === 'presencial' ? 'Abonás cuando llegás' : 'Pago online seguro'}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {errorReserva && <div className="alert alert-error">{errorReserva}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(null)} className="btn btn-secondary">Cancelar</button>
              <button onClick={confirmarReserva} className="btn btn-primary" disabled={reservando}>
                {reservando && <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
                {reservando ? 'Reservando...' : 'Confirmar reserva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal éxito */}
      {modal === 'success' && reservaCreada && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center' }}>
            <div className="modal-body" style={{ padding: 32 }}>
              <CheckCircle size={56} style={{ color: 'var(--green)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>¡Reserva confirmada!</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Tu turno quedó reservado correctamente</p>

              <div style={{ background: 'var(--green-50)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--green-dark)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código de reserva</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--green-dark)', fontFamily: 'monospace' }}>
                    {reservaCreada.codigo}
                  </span>
                  <button onClick={() => navigator.clipboard?.writeText(reservaCreada.codigo)} className="btn btn-ghost btn-sm" title="Copiar">
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, fontSize: 14 }}>
                {[
                  ['Cancha', cancha.nombre],
                  ['Dirección', cancha.direccion],
                  ['Pago', reservaCreada.metodo_pago === 'presencial' ? 'En el lugar' : 'Mercado Pago'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href={waCompartir(reservaCreada)} target="_blank" rel="noopener noreferrer"
                  className="btn btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', background: '#25d366', border: 'none' }}>
                  <MessageCircle size={16} /> Compartir por WhatsApp
                </a>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>Seguir explorando</button>
                  <a href="/mis-turnos" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}>Ver mis turnos</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const chip = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '4px 10px', borderRadius: 99,
  background: 'var(--green-50)', color: 'var(--green-dark)',
  fontSize: 12, fontWeight: 500,
}
