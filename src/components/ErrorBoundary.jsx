import { Component } from 'react'

// Captura errores de render para no mostrar una pantalla en blanco.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // En producción esto queda en la consola; útil para depurar
    console.error('ErrorBoundary:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 16px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚽</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Algo salió mal</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Tuvimos un problema al mostrar esta página. Probá recargar; si sigue pasando, volvé al inicio.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => window.location.reload()} className="btn btn-secondary">Recargar</button>
            <a href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Volver al inicio</a>
          </div>
        </div>
      </div>
    )
  }
}
