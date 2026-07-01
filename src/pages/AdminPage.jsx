import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ShieldCheck, CheckCircle, XCircle, Inbox } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

function fmtFecha(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [accionando, setAccionando] = useState(null)

  useSEO({ title: 'Administración' })

  useEffect(() => {
    if (authLoading) return
    if (profile?.es_admin) fetchSolicitudes()
    else setLoading(false)
  }, [profile, authLoading])

  async function fetchSolicitudes() {
    setLoading(true)
    const { data } = await supabase.rpc('solicitudes_pendientes')
    setSolicitudes(data || [])
    setLoading(false)
  }

  async function resolver(id, aprobar) {
    setAccionando(id)
    await supabase.rpc('resolver_solicitud_dueno', { p_solicitud_id: id, p_aprobar: aprobar })
    setAccionando(null)
    fetchSolicitudes()
  }

  if (authLoading || loading) return <div className="loading-center"><div className="spinner" /></div>

  if (!profile?.es_admin) {
    return (
      <div className="page"><div className="container" style={{ textAlign: 'center', paddingTop: 64 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Acceso restringido</h1>
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>Esta sección es solo para administradores.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Volver al inicio</Link>
      </div></div>
    )
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <ShieldCheck size={22} style={{ color: 'var(--green)' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Solicitudes de dueño</h1>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
          Aprobá o rechazá a quienes piden registrar canchas. Al aprobar, la cuenta pasa a ser dueño y puede publicar canchas.
        </p>

        {solicitudes.length === 0 ? (
          <div className="empty-state">
            <Inbox size={48} />
            <p>No hay solicitudes pendientes</p>
            <span>Cuando alguien pida registrar sus canchas, aparece acá</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {solicitudes.map(s => (
              <div key={s.solicitud_id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{s.nombre}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{s.email}</div>
                    {s.nombre_complejo && <div style={{ fontSize: 13, marginTop: 4 }}>🏟️ {s.nombre_complejo}</div>}
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Solicitado el {fmtFecha(s.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <button onClick={() => resolver(s.solicitud_id, true)} disabled={accionando === s.solicitud_id}
                      className="btn btn-sm" style={{ background: 'var(--green)', color: 'white', border: 'none' }}>
                      {accionando === s.solicitud_id ? '...' : <><CheckCircle size={14} /> Aprobar</>}
                    </button>
                    <button onClick={() => resolver(s.solicitud_id, false)} disabled={accionando === s.solicitud_id}
                      className="btn btn-sm btn-danger">
                      <XCircle size={14} /> Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
