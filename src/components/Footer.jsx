import { Link } from 'react-router-dom'

export default function Footer() {
  const anio = new Date().getFullYear()

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--card)',
      marginTop: 'auto',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', padding: '18px 16px',
      }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          © {anio} Canchas Tandil
        </span>

        <nav style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link to="/terminos" className="mono-caps" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>
            Términos y condiciones
          </Link>
          <Link to="/privacidad" className="mono-caps" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>
            Privacidad
          </Link>
        </nav>
      </div>
    </footer>
  )
}
