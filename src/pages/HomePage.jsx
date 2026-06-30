import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TIPO_DB } from '../lib/tipoCancha'
import CourtCard from '../components/CourtCard'
import CanchasMap from '../components/CanchasMap'
import { Search, SlidersHorizontal, X, Heart, Map as MapIcon, List } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

const TIPOS_FILTRO = ['Todos', ...Object.keys(TIPO_DB)]

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
  else filtradas = [...filtradas].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const hayFiltrosActivos = tipoFiltro !== 'Todos' || precioMax || busqueda || soloFavoritos

  function limpiarFiltros() {
    setBusqueda(''); setTipoFiltro('Todos'); setPrecioMax(''); setSoloFavoritos(false)
  }

  const precioMinDB = canchas.length ? Math.min(...canchas.map(c => c.precio_hora)) : 0
  const precioMaxDB = canchas.length ? Math.max(...canchas.map(c => c.precio_hora)) : 50000

  return (
    <div className="page">
      <div className="container">
        {/* Hero + búsqueda */}
        <div style={{
          background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
          borderRadius: 'var(--radius-lg)', padding: '32px 24px', marginBottom: 20,
          color: 'white', textAlign: 'center',
        }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Canchas en Tandil 🏟️</h1>
          <p style={{ fontSize: 15, opacity: 0.9, marginBottom: 20 }}>Encontrá y reservá tu cancha favorita en segundos</p>
          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              className="form-input"
              placeholder="Buscar por nombre o dirección..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ paddingLeft: 36, background: 'white', border: 'none' }}
            />
          </div>
        </div>

        {/* Barra de filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setMostrarFiltros(f => !f)}
            className={`btn btn-sm ${mostrarFiltros ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexShrink: 0 }}
          >
            <SlidersHorizontal size={14} /> Filtros {hayFiltrosActivos && <span className="badge badge-green" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 4 }}>!</span>}
          </button>

          {user && (
            <button onClick={() => setSoloFavoritos(f => !f)}
              className={`btn btn-sm ${soloFavoritos ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexShrink: 0 }}>
              <Heart size={14} style={{ fill: soloFavoritos ? 'currentColor' : 'none' }} /> Favoritos
            </button>
          )}

          {/* Tipos rápidos */}
          {TIPOS_FILTRO.map(tipo => (
            <button key={tipo} onClick={() => setTipoFiltro(tipo)}
              className={`btn btn-sm ${tipoFiltro === tipo ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexShrink: 0 }}>
              {tipo}
            </button>
          ))}

          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', flexShrink: 0 }}>
              <X size={12} /> Limpiar
            </button>
          )}

          <select value={ordenar} onChange={e => setOrdenar(e.target.value)}
            className="form-select" style={{ marginLeft: 'auto', width: 'auto', fontSize: 13, padding: '6px 10px' }}>
            <option value="recientes">Más recientes</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
            <option value="nombre">Nombre A-Z</option>
          </select>
        </div>

        {/* Panel de filtros avanzados */}
        {mostrarFiltros && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
                <label className="form-label">Precio máximo por hora</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="range"
                    min={precioMinDB}
                    max={precioMaxDB}
                    step={1000}
                    value={precioMax || precioMaxDB}
                    onChange={e => setPrecioMax(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)', minWidth: 80, textAlign: 'right' }}>
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

        {/* Resultados */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtradas.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No se encontraron canchas</p>
            <span>
              {hayFiltrosActivos
                ? <button onClick={limpiarFiltros} style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}>Limpiar filtros</button>
                : 'Aún no hay canchas registradas'}
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
                {filtradas.length} {filtradas.length === 1 ? 'cancha encontrada' : 'canchas encontradas'}
                {precioMax && Number(precioMax) < precioMaxDB && ` · hasta $${Number(precioMax).toLocaleString('es-AR')}/h`}
              </p>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setVista('lista')} className={`btn btn-sm ${vista === 'lista' ? 'btn-primary' : 'btn-secondary'}`}>
                  <List size={14} /> Lista
                </button>
                <button onClick={() => setVista('mapa')} className={`btn btn-sm ${vista === 'mapa' ? 'btn-primary' : 'btn-secondary'}`}>
                  <MapIcon size={14} /> Mapa
                </button>
              </div>
            </div>

            {vista === 'mapa' ? (
              <CanchasMap canchas={filtradas} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {filtradas.map(c => (
                  <CourtCard
                    key={c.id}
                    cancha={c}
                    rating={ratings[c.id]}
                    esFavorito={favoritos.has(c.id)}
                    onToggleFavorito={user ? toggleFavorito : undefined}
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
