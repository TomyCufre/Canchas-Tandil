import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { LogOut, LayoutDashboard, Calendar, Home, UserCircle, ShieldCheck, Bell } from 'lucide-react'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [pendientes, setPendientes] = useState(0)

  // Contador de reservas pendientes para el dueño (con actualización en vivo)
  useEffect(() => {
    if (profile?.rol !== 'dueno') { setPendientes(0); return }
    let cancelado = false
    const fetchPendientes = async () => {
      const { count } = await supabase.from('reservas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente')
      if (!cancelado) setPendientes(count || 0)
    }
    fetchPendientes()
    const channel = supabase.channel('nav-pendientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, fetchPendientes)
      .subscribe()
    return () => { cancelado = true; supabase.removeChannel(channel) }
  }, [profile])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 56, gap: 8 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 'auto' }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--green)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18 }}>⚽</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
            Canchas <span style={{ color: 'var(--green)' }}>Tandil</span>
          </span>
        </Link>

        {profile ? (
          <>
            <Link to="/" className="btn btn-ghost btn-sm hide-mobile">
              <Home size={15} /> Canchas
            </Link>
            {profile.rol === 'jugador' && (
              <Link to="/mis-turnos" className="btn btn-ghost btn-sm">
                <Calendar size={15} />
                <span className="hide-mobile">Mis turnos</span>
              </Link>
            )}
            {profile.rol === 'dueno' && (
              <>
                <Link to="/panel" className="btn btn-ghost btn-sm" title="Reservas pendientes" style={{ position: 'relative' }}>
                  <Bell size={16} />
                  {pendientes > 0 && (
                    <span style={{
                      position: 'absolute', top: 0, right: 0, background: 'var(--error)', color: '#fff',
                      fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                    }}>{pendientes > 99 ? '99+' : pendientes}</span>
                  )}
                </Link>
                <Link to="/panel" className="btn btn-ghost btn-sm">
                  <LayoutDashboard size={15} />
                  <span className="hide-mobile">Panel</span>
                </Link>
              </>
            )}
            {profile.es_admin && (
              <Link to="/admin" className="btn btn-ghost btn-sm" style={{ color: 'var(--green)' }}>
                <ShieldCheck size={15} />
                <span className="hide-mobile">Admin</span>
              </Link>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid var(--border)', paddingLeft: 8 }}>
              <Link to="/perfil" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--green)' }} />
                  : <UserCircle size={28} style={{ color: 'var(--muted)' }} />}
                <div style={{ lineHeight: 1.2 }} className="hide-mobile">
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{profile.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{profile.rol === 'dueno' ? 'dueño' : 'jugador'}</div>
                </div>
              </Link>
              <button onClick={handleSignOut} className="btn btn-ghost btn-sm" title="Cerrar sesión">
                <LogOut size={15} />
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Ingresar</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  )
}
