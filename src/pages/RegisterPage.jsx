import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserPlus, Mail } from 'lucide-react'

const ROLES = [
  { value: 'jugador', label: 'Jugador', desc: 'Reservar canchas', emoji: '🧑' },
  { value: 'dueno', label: 'Dueño', desc: 'Gestionar canchas', emoji: '🏟️' },
]

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '', rol: 'jugador' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setError('')
    setLoading(true)
    const { error, needsConfirmation: confirm } = await signUp(form)
    setLoading(false)
    if (error) {
      setError(
        error.message?.includes('already registered') || error.message?.includes('already been registered')
          ? 'Ya existe una cuenta con ese email.'
          : `Error al crear la cuenta: ${error.message}`
      )
      return
    }
    if (confirm) setNeedsConfirmation(true)
    else navigate('/')
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
          <Link to="/login" className="btn btn-primary btn-full">Ir a Iniciar sesión</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚽</div>
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
              <input type="password" className="form-input" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set('password')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
              <input type="tel" className="form-input" placeholder="2494 000000" value={form.telefono} onChange={set('telefono')} />
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

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <UserPlus size={16} />}
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
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
