import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserPlus, Mail, MessageCircle, ArrowLeft } from 'lucide-react'
import { normalizarTelefono } from '../lib/telefono'
import { supabase } from '../lib/supabase'

const ROLES = [
  { value: 'jugador', label: 'Jugador', desc: 'Reservar canchas', emoji: '🧑' },
  { value: 'dueno', label: 'Dueño', desc: 'Requiere aprobación', emoji: '🏟️' },
]

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '', rol: 'jugador', nombreComplejo: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [paso, setPaso] = useState('datos')   // 'datos' | 'codigo'
  const [tel, setTel] = useState('')           // teléfono normalizado (10 dígitos)
  const [codigo, setCodigo] = useState('')
  const [reenviado, setReenviado] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  // Llama a la función de verificación. Devuelve { ok, error, sinConfigurar }.
  // Si el servicio no está configurado (503), el registro sigue sin verificación.
  async function llamarVerificacion(body) {
    const { data, error: fnError } = await supabase.functions.invoke('verificar-telefono', { body })
    if (!fnError) return { ok: true, ...data }
    let payload = null
    const status = fnError.context?.status
    try { payload = await fnError.context?.json() } catch { /* sin cuerpo */ }
    if (status === 503) return { ok: false, sinConfigurar: true }
    return { ok: false, error: payload?.error }
  }

  async function crearCuenta(telefono) {
    const { error, needsConfirmation: confirm } = await signUp({
      nombre: form.nombre,
      email: form.email,
      password: form.password,
      telefono,
      quiereDueno: form.rol === 'dueno',
      nombreComplejo: form.nombreComplejo,
    })
    if (error) {
      return error.message?.includes('already registered') || error.message?.includes('already been registered')
        ? 'Ya existe una cuenta con ese email.'
        : `Error al crear la cuenta: ${error.message}`
    }
    if (confirm) setNeedsConfirmation(true)
    else navigate('/')
    return null
  }

  // Paso 1: validar datos y mandar el código por WhatsApp
  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (!form.telefono.trim()) { setError('El teléfono es obligatorio'); return }
    const telNormalizado = normalizarTelefono(form.telefono)
    if (!telNormalizado) { setError('Ingresá un número de celular argentino válido (ej: 2494 123456)'); return }

    setError(''); setLoading(true)
    const res = await llamarVerificacion({ accion: 'enviar', telefono: telNormalizado })

    // Verificación no configurada todavía: creamos la cuenta sin ese paso
    if (res.sinConfigurar) {
      const msg = await crearCuenta(telNormalizado)
      setLoading(false)
      if (msg) setError(msg)
      return
    }

    setLoading(false)
    if (!res.ok) {
      setError(res.error || 'No pudimos enviar el código por WhatsApp. Intentá de nuevo en un momento.')
      return
    }
    setTel(telNormalizado)
    setCodigo('')
    setPaso('codigo')
  }

  async function reenviarCodigo() {
    setError(''); setLoading(true)
    const res = await llamarVerificacion({ accion: 'enviar', telefono: tel })
    setLoading(false)
    if (!res.ok) { setError(res.error || 'No pudimos reenviar el código.'); return }
    setReenviado(true)
    setTimeout(() => setReenviado(false), 4000)
  }

  // Paso 2: confirmar el código y recién ahí crear la cuenta
  async function confirmarCodigo(e) {
    e.preventDefault()
    setError(''); setLoading(true)

    const res = await llamarVerificacion({ accion: 'confirmar', telefono: tel, codigo })
    if (!res.ok && !res.sinConfigurar) {
      setLoading(false)
      setError(res.error || 'El código es incorrecto o venció.')
      return
    }

    const msg = await crearCuenta(tel)
    setLoading(false)
    if (msg) { setError(msg); setPaso('datos') }
  }

  if (needsConfirmation) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ width: '100%', maxWidth: 420, padding: '0 16px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Mail size={28} style={{ color: 'var(--green)' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Confirmá tu email</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Te enviamos un enlace de confirmación a <strong style={{ color: 'var(--text)' }}>{form.email}</strong>. Abrilo para activar tu cuenta.
          </p>
          <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: 20 }}>
            Si no lo ves, revisá la carpeta de spam.
          </div>
          {form.rol === 'dueno' && (
            <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: 20 }}>
              📋 Tu solicitud para registrar canchas quedó <b>pendiente de aprobación</b>. Vas a poder ingresar como jugador; te habilitamos como dueño cuando la revisemos.
            </div>
          )}
          <Link to="/login" className="btn btn-primary btn-full">Ir a Iniciar sesión</Link>
        </div>
      </div>
    )
  }

  // Paso 2: código que llegó por WhatsApp
  if (paso === 'codigo') {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MessageCircle size={28} style={{ color: '#25d366' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Verificá tu WhatsApp</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
              Te mandamos un código al <strong style={{ color: 'var(--text)' }}>{form.telefono}</strong>. Ingresalo para terminar de crear tu cuenta.
            </p>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <form onSubmit={confirmarCodigo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div className="alert alert-error">{error}</div>}
              {reenviado && <div className="alert alert-info">Te reenviamos el código.</div>}

              <div className="form-group">
                <label className="form-label">Código de verificación</label>
                <input
                  className="form-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={6}
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  style={{ textAlign: 'center', fontSize: 26, letterSpacing: '0.4em', fontWeight: 700 }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || codigo.length < 4}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <UserPlus size={16} />}
                {loading ? 'Verificando...' : 'Verificar y crear cuenta'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <button type="button" onClick={() => { setPaso('datos'); setError('') }} className="btn btn-ghost btn-sm">
                  <ArrowLeft size={14} /> Cambiar número
                </button>
                <button type="button" onClick={reenviarCodigo} disabled={loading} className="btn btn-ghost btn-sm">
                  Reenviar código
                </button>
              </div>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            ¿No te llegó? Revisá que el número tenga WhatsApp y que esté bien escrito.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo-reducido.png" alt="Canchas Tandil" style={{ width: '100%', maxWidth: 200, height: 'auto', margin: '0 auto 8px', display: 'block' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Crear cuenta</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Unite a Canchas Tandil</p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input className="form-input" placeholder="Juan Pérez" value={form.nombre} onChange={set('nombre')} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="tu@email.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-input" placeholder="Mínimo 8 caracteres" value={form.password} onChange={set('password')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Celular</label>
              <input type="tel" inputMode="tel" className="form-input" placeholder="2494 123456" value={form.telefono} onChange={set('telefono')} required />
              <p className="form-hint">Te vamos a enviar un código por WhatsApp para verificarlo. Con código de área, sin el 0 ni el 15.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de cuenta</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {ROLES.map(r => (
                  <label key={r.value} style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    border: `2px solid ${form.rol === r.value ? 'var(--green)' : 'var(--border-dark)'}`,
                    borderRadius: 'var(--radius)', padding: '10px 12px',
                    background: form.rol === r.value ? 'var(--green-50)' : 'var(--card)',
                    transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="rol" value={r.value} checked={form.rol === r.value} onChange={set('rol')} style={{ display: 'none' }} />
                    <span style={{ fontSize: 18 }}>{r.emoji}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {form.rol === 'dueno' && (
              <div className="form-group">
                <label className="form-label">Nombre de tu complejo / cancha <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
                <input className="form-input" placeholder="Ej: Club Nahuel" value={form.nombreComplejo} onChange={set('nombreComplejo')} />
                <p className="form-hint">Ser dueño requiere aprobación. Mientras tanto podés usar la app como jugador; te avisamos cuando te habilitemos.</p>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <MessageCircle size={16} />}
              {loading ? 'Enviando código...' : 'Continuar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--green)', fontWeight: 500 }}>Ingresá</Link>
        </p>
      </div>
    </div>
  )
}
