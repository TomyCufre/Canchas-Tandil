import { useEffect, useState, lazy, Suspense } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TIPO_DB } from '../lib/tipoCancha'
import CourtCard from '../components/CourtCard'
import { Search, SlidersHorizontal, X, Heart, Map as MapIcon, List } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

// El mapa (con Leaflet) se carga recién cuando el usuario abre la vista de mapa
const CanchasMap = lazy(() => import('../components/CanchasMap'))

const TIPOS_FILTRO = ['Todos', ...Object.keys(TIPO_DB)]

// Distancia en km entre dos coordenadas (haversine)
function distanciaKm(a, b) {
  const R = 6371, toRad = d => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export default function HomePage() {
  const { user } = useAuth()
  const [canchas, setCanchas] = useState([])
  const [ratings, setRatings] = useState({})
  const [favoritos, setFavoritos] = useState(new Set())
  const [soloFavoritos, setSoloFavoritos] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('Todos')
  const [precioMax, setPrecioMax] = useState('')
  const [ordenar, setOrdenar] = useState('recientes')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [vista, setVista] = useState('lista')
  const [userPos, setUserPos] = useState(null)
  const [geoEstado, setGeoEstado] = useState('') // '', 'pidiendo', 'error'

  function pedirUbicacion() {
    if (userPos || !navigator.geolocation) { if (!navigator.geolocation) setGeoEstado('error'); return }
    setGeoEstado('pidiendo')
    navigator.geolocation.getCurrentPosition(
      pos => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoEstado('') },
      () => setGeoEstado('error'),
      { timeout: 10000 }
    )
  }

  function handleOrdenar(value) {
    setOrdenar(value)
    if (value === 'cercania') pedirUbicacion()
  }

  useSEO({ title: 'Canchas de fútbol en Tandil', description: 'Encontrá y reservá canchas de fútbol en Tandil. Fútbol 5, 6, 7, 8 y 11. Turnos online en segundos.' })
  useEffect(() => { fetchCanchas() }, [])

  useEffect(() => {
    if (!user) { setFavoritos(new Set()); setSoloFavoritos(false); return }
    supabase.from('favoritos').select('cancha_id').eq('jugador_id', user.id)
      .then(({ data }) => setFavoritos(new Set((data || []).map(f => f.cancha_id))))
  }, [user])

  async function toggleFavorito(canchaId) {
    if (!user) return
    const next = new Set(favoritos)
    if (next.has(canchaId)) {
      next.delete(canchaId); setFavoritos(next)
      await supabase.from('favoritos').delete().eq('jugador_id', user.id).eq('cancha_id', canchaId)
    } else {
      next.add(canchaId); setFavoritos(next)
      await supabase.from('favoritos').insert({ jugador_id: user.id, cancha_id: canchaId })
    }
  }

  async function fetchCanchas() {
    const [{ data: cs }, { data: rs }] = await Promise.all([
      supabase.from('canchas').select('*').eq('activa', true),
      supabase.from('resenas').select('cancha_id, puntuacion'),
    ])
    setCanchas(cs || [])

    // Promedio y cantidad de reseñas por cancha
    const acum = {}
    ;(rs || []).forEach(r => {
      const a = acum[r.cancha_id] || { suma: 0, cantidad: 0 }
      a.suma += r.puntuacion; a.cantidad += 1
      acum[r.cancha_id] = a
    })
    const map = {}
    Object.entries(acum).forEach(([id, { suma, cantidad }]) => {
      map[id] = { promedio: suma / cantidad, cantidad }
    })
    setRatings(map)
    setLoading(false)
  }

  const precioMaxNum = precioMax ? Number(precioMax) : Infinity

  let filtradas = canchas.filter(c => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !q || c.nombre.toLowerCase().includes(q) || c.direccion.toLowerCase().includes(q)
    const coincideTipo = tipoFiltro === 'Todos' || c.tipo === TIPO_DB[tipoFiltro]
    const coincidePrecio = !precioMax || c.precio_hora <= precioMaxNum
    const coincideFav = !soloFavoritos || favoritos.has(c.id)
    return coincideBusqueda && coincideTipo && coincidePrecio && coincideFav
  })

  if (ordenar === 'precio_asc') filtradas = [...filtradas].sort((a, b) => a.precio_hora - b.precio_hora)
  else if (ordenar === 'precio_desc') filtradas = [...filtradas].sort((a, b) => b.precio_hora - a.precio_hora)
  else if (ordenar === 'nombre') filtradas = [...filtradas].sort((a, b) => a.nombre.localeCompare(b.nombre))
  else if (ordenar === 'cercania' && userPos) {
    const dist = c => (c.latitud && c.longitud) ? distanciaKm(userPos, { lat: c.latitud, lng: c.longitud }) : Infinity
    filtradas = [...filtradas].sort((a, b) => dist(a) - dist(b))
  }
  else filtradas = [...filtradas].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const hayFiltrosActivos = tipoFiltro !== 'Todos' || precioMax || busqueda || soloFavoritos

  function limpiarFiltros() {
    setBusqueda(''); setTipoFiltro('Todos'); setPrecioMax(''); setSoloFavoritos(false)
  }

  const precioMinDB = canchas.length ? Math.min(...canchas.map(c => c.precio_hora)) : 0
  const precioMaxDB = canchas.length ? Math.max(...canchas.map(c => c.precio_hora)) : 50000

  // Chip de filtro rápido (estilo "etiqueta técnica" del sistema de diseño)
  const chip = (activo) => ({
    flexShrink: 0,
    fontFamily: 'var(--font-mono-caps)',
    fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
    padding: '8px 14px',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'all .15s',
    border: `1px solid ${activo ? 'var(--green)' : 'var(--border-dark)'}`,
    background: activo ? 'var(--green-50)' : 'transparent',
    color: activo ? 'var(--green)' : 'var(--muted)',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  })

  return (
    <div className="page" style={{ paddingTop: 0 }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--green-50) 0%, var(--bg) 60%)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
      }}>
        {/* Líneas de césped, sutiles */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, opacity: 0.5,
          background: 'repeating-linear-gradient(90deg, transparent 0 56px, color-mix(in srgb, var(--green) 8%, transparent) 56px 112px)',
          pointerEvents: 'none',
        }} />
        {/* Resplandor de reflector */}
        <div aria-hidden style={{
          position: 'absolute', top: '-40%', right: '-10%', width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--green) 22%, transparent) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', padding: '40px 16px 32px' }}>
          <h1 className="display-font" style={{
            fontSize: 'clamp(30px, 7vw, 48px)', lineHeight: 1, fontStyle: 'italic',
            color: 'var(--text)', marginBottom: 10,
          }}>
            Canchas en <span style={{ color: 'var(--green)' }}>Tandil</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-light)', marginBottom: 22, maxWidth: 460 }}>
            Encontrá y reservá tu cancha favorita en segundos. ¡El partido te espera!
          </p>

          <div style={{ position: 'relative', maxWidth: 520 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              placeholder="Buscar por nombre o dirección..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ paddingLeft: 42, height: 48, fontSize: 15, boxShadow: 'var(--shadow-md)' }}
            />
          </div>
        </div>
      </section>

      <div className="container">
        {/* ── Filtros rápidos ────────────────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          <div className="mono-caps" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Modalidad</div>
          <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {TIPOS_FILTRO.map(tipo => (
              <button key={tipo} onClick={() => setTipoFiltro(tipo)} style={chip(tipoFiltro === tipo)}>
                {tipo}
              </button>
            ))}
          </div>
        </div>

        {/* ── Controles ──────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setMostrarFiltros(f => !f)} style={chip(mostrarFiltros)}>
            <SlidersHorizontal size={14} /> Filtros
            {hayFiltrosActivos && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warn)' }} />}
          </button>

          {user && (
            <button onClick={() => setSoloFavoritos(f => !f)} style={chip(soloFavoritos)}>
              <Heart size={14} style={{ fill: soloFavoritos ? 'currentColor' : 'none' }} /> Favoritos
            </button>
          )}

          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', flexShrink: 0 }}>
              <X size={12} /> Limpiar
            </button>
          )}

          <select value={ordenar} onChange={e => handleOrdenar(e.target.value)}
            className="form-select" style={{ marginLeft: 'auto', width: 'auto', fontSize: 13, padding: '7px 10px' }}>
            <option value="recientes">Más recientes</option>
            <option value="cercania">Más cercanas</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
            <option value="nombre">Nombre A-Z</option>
          </select>
        </div>

        {/* ── Filtros avanzados ──────────────────────────────── */}
        {mostrarFiltros && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
                <label className="form-label">Precio máximo por turno</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="range"
                    min={precioMinDB}
                    max={precioMaxDB}
                    step={1000}
                    value={precioMax || precioMaxDB}
                    onChange={e => setPrecioMax(e.target.value)}
                    style={{ flex: 1, accentColor: 'var(--green)' }}
                  />
                  <span className="mono-caps" style={{ fontSize: 14, color: 'var(--green)', minWidth: 84, textAlign: 'right' }}>
                    ${Number(precioMax || precioMaxDB).toLocaleString('es-AR')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  <span>${precioMinDB.toLocaleString('es-AR')}</span>
                  <span>${precioMaxDB.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {precioMax && Number(precioMax) < precioMaxDB && (
                <button onClick={() => setPrecioMax('')} className="btn btn-ghost btn-sm" style={{ color: 'var(--muted)' }}>
                  <X size={12} /> Quitar límite
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Resultados ─────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton" style={{ height: 180, borderRadius: 0 }} />
                <div style={{ padding: 14 }}>
                  <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 14 }} />
                  <div className="skeleton" style={{ height: 20, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtradas.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No se encontraron canchas</p>
            <span>
              {hayFiltrosActivos
                ? <button onClick={limpiarFiltros} style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Limpiar filtros</button>
                : 'Aún no hay canchas registradas'}
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <h2 className="display-font" style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                <span style={{ width: 4, height: 20, background: 'var(--green)', borderRadius: 2, display: 'inline-block' }} />
                {filtradas.length} {filtradas.length === 1 ? 'cancha' : 'canchas'}
                {precioMax && Number(precioMax) < precioMaxDB && (
                  <span className="mono-caps" style={{ fontSize: 11, color: 'var(--muted)' }}>
                    · hasta ${Number(precioMax).toLocaleString('es-AR')}
                  </span>
                )}
              </h2>
              <div style={{ display: 'flex', gap: 4, border: '1px solid var(--border-dark)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <button onClick={() => setVista('lista')}
                  className="mono-caps"
                  style={{
                    fontSize: 11, padding: '7px 12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    background: vista === 'lista' ? 'var(--green-50)' : 'transparent',
                    color: vista === 'lista' ? 'var(--green)' : 'var(--muted)',
                  }}>
                  <List size={14} /> Lista
                </button>
                <button onClick={() => setVista('mapa')}
                  className="mono-caps"
                  style={{
                    fontSize: 11, padding: '7px 12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    background: vista === 'mapa' ? 'var(--green-50)' : 'transparent',
                    color: vista === 'mapa' ? 'var(--green)' : 'var(--muted)',
                  }}>
                  <MapIcon size={14} /> Mapa
                </button>
              </div>
            </div>

            {ordenar === 'cercania' && geoEstado === 'pidiendo' && (
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Obteniendo tu ubicación…</p>
            )}
            {ordenar === 'cercania' && geoEstado === 'error' && (
              <p style={{ fontSize: 12, color: 'var(--error)', marginBottom: 12 }}>
                No pudimos acceder a tu ubicación. Activá los permisos del navegador para ordenar por cercanía.
              </p>
            )}

            {vista === 'mapa' ? (
              <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
                <CanchasMap canchas={filtradas} />
              </Suspense>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {filtradas.map(c => (
                  <CourtCard
                    key={c.id}
                    cancha={c}
                    rating={ratings[c.id]}
                    esFavorito={favoritos.has(c.id)}
                    onToggleFavorito={user ? toggleFavorito : undefined}
                    distancia={ordenar === 'cercania' && userPos && c.latitud && c.longitud
                      ? distanciaKm(userPos, { lat: c.latitud, lng: c.longitud }) : null}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
