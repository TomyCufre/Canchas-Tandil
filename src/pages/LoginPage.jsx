import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, Mail, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [modo, setModo] = useState('login') // 'login' | 'recuperar'
  const [resetEnviado, setResetEnviado] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(form.email, form.password)
    setLoading(false)
    if (error) setError('Email o contraseña incorrectos')
    else navigate('/')
  }

  async function handleReset(e) {
    e.preventDefault()
    if (!form.email.trim()) { setError('Ingresá tu email'); return }
    setError('')
    setLoading(true)
    const { error } = await resetPassword(form.email.trim())
    setLoading(false)
    // Mostramos éxito siempre (no revelamos si el email existe o no, por seguridad)
    if (error && !error.message?.toLowerCase().includes('rate')) setError('No pudimos enviar el email. Probá de nuevo.')
    else setResetEnviado(true)
  }

  // Pantalla: "revisá tu email"
  if (modo === 'recuperar' && resetEnviado) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ width: '100%', maxWidth: 380, padding: '0 16px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Mail size={28} style={{ color: 'var(--green)' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Revisá tu email</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Si existe una cuenta con <strong style={{ color: 'var(--text)' }}>{form.email}</strong>, te enviamos un enlace para restablecer tu contraseña. Abrilo desde este dispositivo.
          </p>
          <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: 20 }}>
            Si no lo ves, revisá la carpeta de spam.
          </div>
          <button onClick={() => { setModo('login'); setResetEnviado(false) }} className="btn btn-primary btn-full">
            Volver a Iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚽</div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{modo === 'login' ? 'Bienvenido de nuevo' : 'Recuperar contraseña'}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            {modo === 'login' ? 'Ingresá a tu cuenta de Canchas Tandil' : 'Te enviamos un link para crear una nueva'}
          </p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          {modo === 'login' ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="tu@email.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoFocus />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label className="form-label">Contraseña</label>
                  <button type="button" onClick={() => { setModo('recuperar'); setError('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', fontSize: 12, fontWeight: 500, padding: 0 }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input type="password" className="form-input" placeholder="••••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <LogIn size={16} />}
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Email de tu cuenta</label>
                <input type="email" className="form-input" placeholder="tu@email.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoFocus />
                <p className="form-hint">Te mandamos un enlace para crear una nueva contraseña.</p>
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Mail size={16} />}
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
              <button type="button" onClick={() => { setModo('login'); setError('') }}
                className="btn btn-ghost btn-sm" style={{ justifyContent: 'center' }}>
                <ArrowLeft size={14} /> Volver a Iniciar sesión
              </button>
            </form>
          )}
        </div>

        {modo === 'login' && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
            ¿No tenés cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--green)', fontWeight: 500 }}>Registrate</Link>
          </p>
        )}
      </div>
    </div>
  )
}
