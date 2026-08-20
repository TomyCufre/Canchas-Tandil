import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TIPO_DB, TIPO_LABEL } from '../lib/tipoCancha'
import { ArrowLeft, Upload, X, MapPin } from 'lucide-react'

const TIPOS_UI = Object.keys(TIPO_DB)

function parseGoogleMapsUrl(url) {
  // Formato: /@-37.321,-59.132,17z
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
  // Formato: ?q=-37.321,-59.132
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
  // Formato: /place/...?q=
  const placeMatch = url.match(/maps\?q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) }
  return null
}

export default function CourtFormPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)
  const fileInputRef = useRef()

  const [form, setForm] = useState({
    nombre: '', direccion: '', tipo: 'futbol5', precio_hora: '', precio_por_persona: '', descripcion: '',
    tiene_vestuario: false, tiene_estacionamiento: false, tiene_iluminacion: true,
    tiene_una_pelota: false, tiene_dos_pelotas: false, tiene_pecheras: false,
    acepta_presencial: true, acepta_online: false,
    requiere_sena: false, sena_monto: '', datos_pago: '',
    fotos: [], latitud: null, longitud: null, maps_url: '',
  })

  const [loading, setLoading] = useState(esEdicion)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingIdx, setUploadingIdx] = useState(null)
  const [mapsParseMsg, setMapsParseMsg] = useState('')

  useEffect(() => { if (esEdicion) loadCancha() }, [id])

  async function loadCancha() {
    const { data } = await supabase.from('canchas').select('*').eq('id', id).eq('dueno_id', user.id).single()
    if (!data) { navigate('/panel'); return }
    setForm({
      nombre: data.nombre, direccion: data.direccion, tipo: data.tipo,
      precio_hora: data.precio_hora, precio_por_persona: data.precio_por_persona || '',
      descripcion: data.descripcion || '',
      tiene_vestuario: data.tiene_vestuario || false,
      tiene_estacionamiento: data.tiene_estacionamiento || false,
      tiene_iluminacion: data.tiene_iluminacion !== false,
      tiene_una_pelota: data.tiene_una_pelota || false,
      tiene_dos_pelotas: data.tiene_dos_pelotas || false,
      tiene_pecheras: data.tiene_pecheras || false,
      acepta_presencial: data.acepta_presencial !== false,
      acepta_online: data.acepta_online || false,
      requiere_sena: data.requiere_sena || false,
      sena_monto: data.sena_monto || '',
      datos_pago: data.datos_pago || '',
      fotos: data.fotos || [],
      latitud: data.latitud, longitud: data.longitud, maps_url: data.maps_url || '',
    })
    setLoading(false)
  }

  function setField(f, v) { setForm(x => ({ ...x, [f]: v })) }
  function toggleBool(f) { setForm(x => ({ ...x, [f]: !x[f] })) }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    if (form.fotos.length + files.length > 5) { setError('Máximo 5 fotos por cancha'); return }

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Solo se aceptan archivos JPG, PNG o WebP'); return
      }
      if (file.size > 5 * 1024 * 1024) { setError('Cada imagen no puede superar 5 MB'); return }
    }

    setError('')
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const idx = form.fotos.length + i
      setUploadingIdx(idx)
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${i}.${ext}`
      const { data, error: upErr } = await supabase.storage.from('canchas-fotos').upload(path, file, { upsert: false })
      if (upErr) { setError(`Error al subir la imagen: ${upErr.message}`); setUploadingIdx(null); return }
      const { data: { publicUrl } } = supabase.storage.from('canchas-fotos').getPublicUrl(data.path)
      setForm(x => ({ ...x, fotos: [...x.fotos, publicUrl] }))
    }
    setUploadingIdx(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function removeFoto(idx) {
    const url = form.fotos[idx]
    // Intentar borrar del storage si es una URL de nuestro bucket
    if (url.includes('canchas-fotos')) {
      const path = url.split('/canchas-fotos/')[1]
      if (path) await supabase.storage.from('canchas-fotos').remove([path])
    }
    setForm(x => ({ ...x, fotos: x.fotos.filter((_, i) => i !== idx) }))
  }

  function handleMapsUrl(url) {
    setField('maps_url', url)
    setMapsParseMsg('')
    if (!url.trim()) return
    if (url.includes('maps.app.goo.gl')) {
      setMapsParseMsg('⚠️ Link acortado: pegá el link completo de Google Maps para extraer coordenadas')
      return
    }
    const coords = parseGoogleMapsUrl(url)
    if (coords) {
      setForm(x => ({ ...x, maps_url: url, latitud: coords.lat, longitud: coords.lng }))
      setMapsParseMsg(`✓ Coordenadas extraídas: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
    } else {
      setMapsParseMsg('No se pudieron extraer coordenadas. El mapa va a buscar por dirección.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.direccion.trim()) { setError('La dirección es obligatoria'); return }
    if (!form.precio_hora || Number(form.precio_hora) <= 0) { setError('El precio debe ser mayor a 0'); return }
    if (!form.acepta_presencial && !form.acepta_online) { setError('Seleccioná al menos un método de pago'); return }
    if (form.requiere_sena && (!form.sena_monto || Number(form.sena_monto) <= 0)) { setError('Indicá el monto de la seña'); return }
    if (form.requiere_sena && Number(form.sena_monto) > Number(form.precio_hora)) { setError('La seña no puede superar el precio del turno'); return }

    setSaving(true)
    const payload = {
      dueno_id: user.id, nombre: form.nombre.trim(), direccion: form.direccion.trim(),
      tipo: form.tipo, precio_hora: Number(form.precio_hora),
      precio_por_persona: form.precio_por_persona ? Number(form.precio_por_persona) : null,
      descripcion: form.descripcion.trim(),
      tiene_vestuario: form.tiene_vestuario, tiene_estacionamiento: form.tiene_estacionamiento,
      tiene_iluminacion: form.tiene_iluminacion,
      tiene_una_pelota: form.tiene_una_pelota, tiene_dos_pelotas: form.tiene_dos_pelotas, tiene_pecheras: form.tiene_pecheras,
      acepta_presencial: form.acepta_presencial,
      acepta_online: form.acepta_online, fotos: form.fotos,
      requiere_sena: form.requiere_sena,
      sena_monto: form.requiere_sena && form.sena_monto ? Number(form.sena_monto) : null,
      datos_pago: form.requiere_sena ? (form.datos_pago.trim() || null) : null,
      latitud: form.latitud, longitud: form.longitud,
      maps_url: form.maps_url.trim() || null,
    }

    if (esEdicion) {
      const { error: err } = await supabase.from('canchas').update(payload).eq('id', id).eq('dueno_id', user.id)
      if (err) { setError('Error al guardar los cambios.'); setSaving(false); return }
    } else {
      const { data, error: err } = await supabase.from('canchas').insert(payload).select().single()
      if (err) { setError(`Error al crear la cancha: ${err.message}`); setSaving(false); return }
      const slots = []
      for (let dia = 0; dia <= 6; dia++)
        for (let h = 8; h <= 23; h++)
          slots.push({ cancha_id: data.id, dia_semana: dia, hora_inicio: `${String(h).padStart(2,'0')}:00:00`, hora_fin: `${String(h+1).padStart(2,'0')}:00:00`, activo: true })
      await supabase.from('horarios').insert(slots)
    }
    navigate('/panel')
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <button onClick={() => navigate('/panel')} className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></button>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{esEdicion ? 'Editar cancha' : 'Nueva cancha'}</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Info básica */}
          <div className="card" style={{ padding: 20 }}>
            <SectionTitle>Información básica</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" placeholder="Ej: Canchas El Fortín" value={form.nombre} onChange={e => setField('nombre', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de cancha *</label>
                <select className="form-select" value={form.tipo} onChange={e => setField('tipo', e.target.value)}>
                  {TIPOS_UI.map(t => <option key={t} value={TIPO_DB[t]}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Precio por turno (1 hora, ARS) *</label>
                <input type="number" min="1" className="form-input" placeholder="Ej: 60000" value={form.precio_hora} onChange={e => setField('precio_hora', e.target.value)} required />
                <p className="form-hint">Lo que se cobra por reservar el turno completo.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Precio por persona <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
                <input type="number" min="1" className="form-input" placeholder="Ej: 5000" value={form.precio_por_persona} onChange={e => setField('precio_por_persona', e.target.value)} />
                <p className="form-hint">Solo como referencia para el jugador. No reemplaza al precio del turno.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-textarea" placeholder="Contá algo sobre tu cancha..." value={form.descripcion} onChange={e => setField('descripcion', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Fotos */}
          <div className="card" style={{ padding: 20 }}>
            <SectionTitle>Fotos ({form.fotos.length}/5)</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: form.fotos.length < 5 ? 12 : 0 }}>
              {form.fotos.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeFoto(idx)} style={{
                    position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              {uploadingIdx !== null && (
                <div style={{ width: 100, height: 100, borderRadius: 8, background: 'var(--bg)', border: '2px dashed var(--border-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                </div>
              )}
            </div>
            {form.fotos.length < 5 && (
              <>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ width: '100%' }} disabled={uploadingIdx !== null}>
                  <Upload size={15} /> {uploadingIdx !== null ? 'Subiendo...' : 'Subir fotos (JPG / PNG)'}
                </button>
                <p className="form-hint">Máximo 5 fotos · hasta 5 MB cada una</p>
              </>
            )}
          </div>

          {/* Ubicación */}
          <div className="card" style={{ padding: 20 }}>
            <SectionTitle>Ubicación</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Dirección *</label>
                <input className="form-input" placeholder="Ej: Av. Avellaneda 500" value={form.direccion} onChange={e => setField('direccion', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} /> Link de Google Maps
                </label>
                <input
                  className="form-input"
                  placeholder="Pegá el link de Google Maps de tu cancha"
                  value={form.maps_url}
                  onChange={e => handleMapsUrl(e.target.value)}
                />
                {mapsParseMsg && (
                  <p className="form-hint" style={{ color: mapsParseMsg.startsWith('✓') ? 'var(--green)' : mapsParseMsg.startsWith('⚠️') ? '#d97706' : 'var(--muted)' }}>
                    {mapsParseMsg}
                  </p>
                )}
                <p className="form-hint">Abrí Google Maps → buscá tu cancha → Compartir → Copiar link</p>
              </div>
            </div>
          </div>

          {/* Comodidades */}
          <div className="card" style={{ padding: 20 }}>
            <SectionTitle>Comodidades</SectionTitle>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { key: 'tiene_vestuario', label: '🚿 Vestuario' },
                { key: 'tiene_estacionamiento', label: '🅿️ Estacionamiento' },
                { key: 'tiene_iluminacion', label: '💡 Iluminación' },
                { key: 'tiene_una_pelota', label: '⚽ 1 pelota' },
                { key: 'tiene_dos_pelotas', label: '⚽ 2 pelotas' },
                { key: 'tiene_pecheras', label: '🎽 Pecheras' },
              ].map(({ key, label }) => (
                <ToggleChip key={key} active={form[key]} onClick={() => toggleBool(key)} label={label} />
              ))}
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="card" style={{ padding: 20 }}>
            <SectionTitle>Métodos de pago</SectionTitle>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <ToggleChip active={form.acepta_presencial} onClick={() => toggleBool('acepta_presencial')} label="💵 Pago en el lugar" />
              <ToggleChip active={form.acepta_online} onClick={() => toggleBool('acepta_online')} label="💳 Mercado Pago" />
            </div>

            {/* Seña opcional */}
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <ToggleChip active={form.requiere_sena} onClick={() => toggleBool('requiere_sena')} label="🔒 Pedir seña para asegurar el turno" />
              <p className="form-hint" style={{ marginTop: 8 }}>
                Si lo activás, el jugador ve que tiene que enviarte una seña. Vos marcás en el panel cuándo la recibiste.
              </p>

              {form.requiere_sena && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Monto de la seña (ARS) *</label>
                    <input type="number" min="1" className="form-input" placeholder="Ej: 20000"
                      value={form.sena_monto} onChange={e => setField('sena_monto', e.target.value)} />
                    {form.sena_monto > 0 && form.precio_hora > 0 && (
                      <p className="form-hint">
                        El jugador abona ${Number(form.sena_monto).toLocaleString('es-AR')} por adelantado y
                        ${Math.max(0, Number(form.precio_hora) - Number(form.sena_monto)).toLocaleString('es-AR')} en la cancha.
                      </p>
                    )}
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">¿Dónde te la envían?</label>
                    <input className="form-input" placeholder="Ej: alias.mercadopago o CBU"
                      value={form.datos_pago} onChange={e => setField('datos_pago', e.target.value)} />
                    <p className="form-hint">Se le muestra al jugador recién después de reservar.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => navigate('/panel')} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving || uploadingIdx !== null} style={{ flex: 1 }}>
              {saving && <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {saving ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear cancha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h2 style={{ fontSize: 12, fontWeight: 600, marginBottom: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</h2>
}

function ToggleChip({ active, onClick, label }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
      padding: '8px 14px', borderRadius: 'var(--radius)',
      border: `2px solid ${active ? 'var(--green)' : 'var(--border-dark)'}`,
      background: active ? 'var(--green-50)' : 'var(--card)', transition: 'all 0.15s',
    }} onClick={onClick}>
      <span style={{ fontSize: 14 }}>{label}</span>
    </label>
  )
}
