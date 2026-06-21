import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, LayoutDashboard, Calendar, Home, UserCircle } from 'lucide-react'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

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
              <Link to="/panel" className="btn btn-ghost btn-sm">
                <LayoutDashboard size={15} />
                <span className="hide-mobile">Panel</span>
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
