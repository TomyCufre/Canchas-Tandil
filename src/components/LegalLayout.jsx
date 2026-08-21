import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Info } from 'lucide-react'

/** Marca visible para lo que todavía falta definir con el titular. */
export function PorDefinir({ children }) {
  return (
    <mark style={{
      background: 'var(--amber-bg)',
      color: 'var(--amber-fg)',
      border: '1px dashed var(--amber-border)',
      borderRadius: 'var(--radius)',
      padding: '1px 6px',
      fontSize: '0.92em',
      fontWeight: 700,
    }}>
      [{children}]
    </mark>
  )
}

export function Aviso({ children, tono = 'warn' }) {
  const esInfo = tono === 'info'
  const Icono = esInfo ? Info : AlertTriangle
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      background: esInfo ? 'var(--info-bg)' : 'var(--amber-bg)',
      border: `1px solid ${esInfo ? 'var(--info-border)' : 'var(--amber-border)'}`,
      color: esInfo ? 'var(--info-fg)' : 'var(--amber-fg)',
      borderRadius: 'var(--radius)',
      padding: '12px 14px',
      fontSize: 13,
      lineHeight: 1.6,
      margin: '0 0 18px',
    }}>
      <Icono size={17} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>{children}</div>
    </div>
  )
}

export function Seccion({ n, titulo, children }) {
  return (
    <section style={{ marginBottom: 30 }}>
      <h2 className="display-font" style={{ fontSize: 19, marginBottom: 10, display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="mono-caps" style={{ fontSize: 12, color: 'var(--green)' }}>{n}</span>
        {titulo}
      </h2>
      <div className="legal-cuerpo">{children}</div>
    </section>
  )
}

export function LegalLayout({ titulo, actualizado, children }) {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Volver
        </button>

        <h1 className="display-font" style={{ fontSize: 32, lineHeight: 1.05, marginBottom: 6 }}>{titulo}</h1>
        <p className="mono-caps" style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 28 }}>
          Última actualización: {actualizado}
        </p>

        <style>{`
          .legal-cuerpo p { margin-bottom: 12px; line-height: 1.7; color: var(--text-light); }
          .legal-cuerpo ul { margin: 0 0 12px; padding-left: 20px; }
          .legal-cuerpo li { margin-bottom: 8px; line-height: 1.65; color: var(--text-light); }
          .legal-cuerpo b { color: var(--text); }
        `}</style>

        {children}
      </div>
    </div>
  )
}
