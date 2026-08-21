import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'
import { fechaLocal } from '../lib/fecha'
import { LogOut, LayoutDashboard, Calendar, Home, UserCircle, ShieldCheck, Bell, Sun, Moon } from 'lucide-react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { esOscuro, alternarTema } = useTheme()
  const navigate = useNavigate()
  const [pendientes, setPendientes] = useState(0)
  const [sinResultado, setSinResultado] = useState(0)

  // Partidos ya jugados a los que el usuario no les cargó el resultado
  useEffect(() => {
    if (!user) { setSinResultado(0); return }
    let cancelado = false
    supabase
      .from('reservas')
      .select('id', { count: 'exact', head: true })
      .eq('jugador_id', user.id)
      .neq('estado', 'cancelada')
      .is('resultado', null)
      .lt('fecha', fechaLocal())
      .then(({ count }) => { if (!cancelado) setSinResultado(count || 0) })
    return () => { cancelado = true }
  }, [user])

  // Contador de reservas pendientes para el dueño: solo de SUS canchas y de fechas futuras
  useEffect(() => {
    if (profile?.rol !== 'dueno' || !user) { setPendientes(0); return }
    let cancelado = false
    const fetchPendientes = async () => {
      const { count } = await supabase
        .from('reservas')
        .select('id, canchas!inner(dueno_id)', { count: 'exact', head: true })
        .eq('canchas.dueno_id', user.id)
        .eq('estado', 'pendiente')
        .gte('fecha', fechaLocal())
      if (!cancelado) setPendientes(count || 0)
    }
    fetchPendientes()
    const channel = supabase.channel('nav-pendientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, fetchPendientes)
      .subscribe()
    return () => { cancelado = true; supabase.removeChannel(channel) }
  }, [profile, user])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const botonTema = (
    <button
      onClick={alternarTema}
      className="btn btn-ghost btn-sm"
      title={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {esOscuro ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )

  return (
    <nav style={{
      background: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 60, gap: 8 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 'auto' }}>
          <img src="/icon-512.png" alt="Canchas Tandil" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
          <span
            className="display-font"
            style={{ fontSize: 22, color: 'var(--green)', fontStyle: 'italic', letterSpacing: '-0.01em', lineHeight: 1 }}
          >
            Canchas Tandil
          </span>
        </Link>

        {profile ? (
          <>
            <Link to="/" className="btn btn-ghost btn-sm hide-mobile">
              <Home size={15} /> Canchas
            </Link>
            <Link to="/mis-turnos" className="btn btn-ghost btn-sm" style={{ position: 'relative' }}
              title={sinResultado > 0 ? `${sinResultado} partido${sinResultado > 1 ? 's' : ''} sin resultado` : 'Mis turnos'}>
              <Calendar size={15} />
              <span className="hide-mobile">Mis turnos</span>
              {sinResultado > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0, background: 'var(--green)', color: 'var(--cta-text)',
                  fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                }}>{sinResultado > 99 ? '99+' : sinResultado}</span>
              )}
            </Link>
            {profile.rol === 'dueno' && (
              <>
                <Link to="/panel" className="btn btn-ghost btn-sm" title="Reservas pendientes" style={{ position: 'relative' }}>
                  <Bell size={16} />
                  {pendientes > 0 && (
                    <span style={{
                      position: 'absolute', top: 0, right: 0, background: 'var(--warn)', color: '#1a1005',
                      fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8,
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
            {botonTema}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid var(--border)', paddingLeft: 8 }}>
              <Link to="/perfil" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--green)' }} />
                  : <UserCircle size={28} style={{ color: 'var(--muted)' }} />}
                <div style={{ lineHeight: 1.2 }} className="hide-mobile">
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{profile.nombre}</div>
                  <div className="mono-caps" style={{ fontSize: 10, color: 'var(--muted)' }}>{profile.rol === 'dueno' ? 'dueño' : 'jugador'}</div>
                </div>
              </Link>
              <button onClick={handleSignOut} className="btn btn-ghost btn-sm" title="Cerrar sesión" aria-label="Cerrar sesión">
                <LogOut size={15} />
              </button>
            </div>
          </>
        ) : (
          <>
            {botonTema}
            <Link to="/login" className="btn btn-ghost btn-sm">Ingresar</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  )
}
