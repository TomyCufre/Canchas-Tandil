import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { KeyRound, CheckCircle } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const [sesion, setSesion] = useState(null) // null = verificando, true/false

  useSEO({ title: 'Nueva contraseña' })

  useEffect(() => {
    // Supabase procesa el token del enlace y crea una sesión de recuperación
    supabase.auth.getSession().then(({ data }) => setSesion(!!data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setSesion(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (pass.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (pass !== pass2) { setError('Las contraseñas no coinciden'); return }
    setError(''); setLoading(true)
    const { error } = await updatePassword(pass)
    setLoading(false)
    if (error) { setError('No se pudo actualizar. El enlace puede haber expirado; pedí uno nuevo.'); return }
    setOk(true)
    setTimeout(() => navigate('/'), 2500)
  }

  const wrap = children => (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 16px' }}>{children}</div>
    </div>
  )

  if (sesion === null) return <div className="loading-center"><div className="spinner" /></div>

  if (ok) return wrap(
    <div style={{ textAlign: 'center' }}>
      <CheckCircle size={56} style={{ color: 'var(--green)', margin: '0 auto 16px' }} />
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>¡Contraseña actualizada!</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>Ya podés usar tu nueva contraseña. Te llevamos al inicio…</p>
    </div>
  )

  if (sesion === false) return wrap(
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Enlace inválido o expirado</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
        Abrí el enlace más reciente desde tu email, o pedí uno nuevo.
      </p>
      <Link to="/login" className="btn btn-primary btn-full">Pedir un nuevo enlace</Link>
    </div>
  )

  return wrap(
    <>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <KeyRound size={28} style={{ color: 'var(--green)' }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Nueva contraseña</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Elegí una contraseña nueva para tu cuenta</p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Nueva contraseña</label>
            <input type="password" className="form-input" placeholder="Mínimo 8 caracteres" value={pass}
              onChange={e => setPass(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Repetir contraseña</label>
            <input type="password" className="form-input" placeholder="••••••••" value={pass2}
              onChange={e => setPass2(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <KeyRound size={16} />}
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </>
  )
}
