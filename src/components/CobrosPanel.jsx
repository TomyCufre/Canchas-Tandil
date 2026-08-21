import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CreditCard, CheckCircle, ExternalLink, Unplug } from 'lucide-react'

export default function CobrosPanel() {
  const [estado, setEstado] = useState(null)   // { conectado, modo, actualizado_at }
  const [token, setToken] = useState('')
  const [modo, setModo] = useState('test')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => { cargarEstado() }, [])

  async function cargarEstado() {
    const { data } = await supabase.rpc('mp_estado')
    const e = Array.isArray(data) ? data[0] : data
    setEstado(e || { conectado: false })
    if (e?.modo) setModo(e.modo)
  }

  async function guardar(e) {
    e.preventDefault()
    if (!token.trim()) { setError('Pegá tu Access Token de Mercado Pago.'); return }
    setGuardando(true); setError(''); setOk('')
    const { error: err } = await supabase.rpc('guardar_mp_credencial', {
      p_access_token: token.trim(),
      p_modo: modo,
    })
    setGuardando(false)
    if (err) { setError('No pudimos guardar las credenciales.'); return }
    setToken('')
    setOk('Cobros conectados correctamente.')
    cargarEstado()
    setTimeout(() => setOk(''), 4000)
  }

  async function desconectar() {
    setGuardando(true); setError(''); setOk('')
    await supabase.rpc('guardar_mp_credencial', { p_access_token: '', p_modo: 'test' })
    setGuardando(false)
    setToken('')
    cargarEstado()
  }

  if (!estado) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 620 }}>
      {/* Estado */}
      <div className="card" style={{
        padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        borderColor: estado.conectado ? 'var(--green)' : 'var(--border)',
        background: estado.conectado ? 'var(--green-50)' : 'var(--card)',
      }}>
        {estado.conectado
          ? <CheckCircle size={22} style={{ color: 'var(--green)', flexShrink: 0 }} />
          : <CreditCard size={22} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {estado.conectado ? 'Cobros online conectados' : 'Cobros online no configurados'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {estado.conectado
              ? <>Modo <b>{estado.modo === 'test' ? 'prueba' : 'producción'}</b> · el dinero va directo a tu cuenta de Mercado Pago</>
              : 'Mientras no lo configures, los jugadores solo pueden pagar en el lugar.'}
          </div>
        </div>
        {estado.conectado && (
          <button onClick={desconectar} className="btn btn-ghost btn-sm" disabled={guardando} style={{ color: 'var(--error)' }}>
            <Unplug size={14} /> Desconectar
          </button>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={guardar} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3 className="display-font" style={{ fontSize: 18, marginBottom: 6 }}>
            {estado.conectado ? 'Actualizar credenciales' : 'Conectar Mercado Pago'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            El dinero de las reservas se acredita <b>directamente en tu cuenta</b>. Canchas Tandil no
            retiene ni intermedia esos pagos.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {ok && <div className="alert alert-success">{ok}</div>}

        <div className="form-group">
          <label className="form-label">Access Token</label>
          <input
            type="password"
            className="form-input"
            placeholder={estado.conectado ? 'Pegá uno nuevo para reemplazarlo' : 'APP_USR-...'}
            value={token}
            onChange={e => setToken(e.target.value)}
            autoComplete="off"
            style={{ fontFamily: 'var(--font-mono-caps)', letterSpacing: 0 }}
          />
          <p className="form-hint">
            Por seguridad no volvemos a mostrarlo una vez guardado.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Modo</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { v: 'test', t: 'Prueba', d: 'Para probar sin plata real' },
              { v: 'produccion', t: 'Producción', d: 'Cobros reales' },
            ].map(({ v, t, d }) => (
              <label key={v} style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                border: `1.5px solid ${modo === v ? 'var(--green)' : 'var(--border-dark)'}`,
                borderRadius: 'var(--radius)', padding: '10px 12px',
                background: modo === v ? 'var(--green-50)' : 'transparent',
              }}>
                <input type="radio" name="modo" value={v} checked={modo === v} onChange={() => setModo(v)} style={{ display: 'none' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: modo === v ? 'var(--green)' : 'var(--text)' }}>{t}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={guardando || !token.trim()}>
          {guardando ? 'Guardando...' : estado.conectado ? 'Actualizar' : 'Conectar'}
        </button>

        <div className="alert alert-info" style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div>
            <b>¿Dónde consigo el Access Token?</b><br />
            Entrá a tu cuenta de Mercado Pago → <i>Tu negocio → Configuración → Gestión y administración →
            Credenciales</i>. Copiá el <b>Access Token</b> de prueba o de producción según el modo que elijas.
            <a href="https://www.mercadopago.com.ar/developers/panel/app" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
              Abrir panel <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </form>

      <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
        Recordá activar <b>Mercado Pago</b> como método de pago en cada cancha que quieras cobrar online,
        desde <i>Mis canchas → Editar</i>.
      </p>
    </div>
  )
}
