import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Camera, Save, User, Trophy, Handshake, Frown } from 'lucide-react'
import { normalizarTelefono } from '../lib/telefono'
import { fechaLocal } from '../lib/fecha'

export default function ProfilePage() {
  const { user, profile, setProfile } = useAuth()
  const fileInputRef = useRef()
  const [form, setForm] = useState({ nombre: profile?.nombre || '', telefono: profile?.telefono || '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)

  // Estadísticas del jugador a partir de sus reservas
  useEffect(() => {
    if (!user) return
    let vivo = true
    supabase.from('reservas')
      .select('fecha, estado, resultado')
      .eq('jugador_id', user.id)
      .then(({ data }) => {
        if (!vivo || !data) return
        const hoy = fechaLocal()
        const mes = hoy.slice(0, 7)          // YYYY-MM
        const anio = hoy.slice(0, 4)         // YYYY
        const activas = data.filter(r => r.estado !== 'cancelada')
        setStats({
          reservados: activas.length,
          cancelados: data.filter(r => r.estado === 'cancelada').length,
          jugadosMes:  activas.filter(r => r.fecha.startsWith(mes)  && r.fecha <= hoy).length,
          jugadosAnio: activas.filter(r => r.fecha.startsWith(anio) && r.fecha <= hoy).length,
          anio,
          ganados:   activas.filter(r => r.resultado === 'ganado').length,
          empatados: activas.filter(r => r.resultado === 'empatado').length,
          perdidos:  activas.filter(r => r.resultado === 'perdido').length,
        })
      })
    return () => { vivo = false }
  }, [user])

  if (!user) return (
    <div className="page"><div className="container" style={{ textAlign: 'center', paddingTop: 64 }}>
      <p>Iniciá sesión para ver tu perfil.</p>
      <a href="/login" className="btn btn-primary" style={{ marginTop: 12 }}>Ingresar</a>
    </div></div>
  )

  async function handleAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Solo JPG, PNG o WebP'); return }
    if (file.size > 2 * 1024 * 1024) { setError('La foto no puede superar 2 MB'); return }

    setUploading(true); setError('')
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { data, error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { setError('Error al subir la foto'); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
    // Anti-caché: el path se reutiliza (upsert), así forzamos al navegador a recargar la imagen
    const urlConCache = `${publicUrl}?t=${Date.now()}`
    await supabase.from('perfiles').update({ avatar_url: urlConCache }).eq('id', user.id)
    setProfile(p => ({ ...p, avatar_url: urlConCache }))
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    const tel = normalizarTelefono(form.telefono)
    if (!tel) { setError('Ingresá un número de celular argentino válido (ej: 2494 123456)'); return }
    setSaving(true); setError(''); setOk(false)
    const { error: err } = await supabase.from('perfiles')
      .update({ nombre: form.nombre.trim(), telefono: tel })
      .eq('id', user.id)
    setSaving(false)
    if (err) { setError('Error al guardar'); return }
    setProfile(p => ({ ...p, nombre: form.nombre.trim(), telefono: tel }))
    setOk(true)
    setTimeout(() => setOk(false), 3000)
  }

  const avatarUrl = profile?.avatar_url

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 480 }}>
        <h1 className="display-font" style={{ fontSize: 26, lineHeight: 1.1, marginBottom: 24 }}>Mi perfil</h1>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'var(--green-50)',
              border: '3px solid var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!avatarUrl && <User size={40} style={{ color: 'var(--green)' }} />}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--green)', border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white',
              }}
              title="Cambiar foto"
            >
              {uploading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Camera size={14} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatar} />
          </div>
        </div>

        {/* ── Historial del jugador ─────────────────────────── */}
        {stats && stats.reservados + stats.cancelados > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 className="display-font" style={{ fontSize: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 4, height: 18, background: 'var(--green)', borderRadius: 2, display: 'inline-block' }} />
              Mi historial
            </h2>

            <div className="grid-4" style={{ marginBottom: 12 }}>
              <div className="stat-card" style={{ padding: 16 }}>
                <div className="stat-label">Reservados</div>
                <div className="stat-value">{stats.reservados}</div>
                <div className="stat-sub">turnos en total</div>
              </div>
              <div className="stat-card" style={{ padding: 16 }}>
                <div className="stat-label">Jugados este mes</div>
                <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.jugadosMes}</div>
                <div className="stat-sub">partidos</div>
              </div>
              <div className="stat-card" style={{ padding: 16 }}>
                <div className="stat-label">Jugados este año</div>
                <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.jugadosAnio}</div>
                <div className="stat-sub">en {stats.anio}</div>
              </div>
              <div className="stat-card" style={{ padding: 16 }}>
                <div className="stat-label">Dados de baja</div>
                <div className="stat-value" style={{ color: stats.cancelados ? 'var(--error)' : undefined }}>{stats.cancelados}</div>
                <div className="stat-sub">cancelados</div>
              </div>
            </div>

            {/* Récord */}
            <div className="card" style={{ padding: 16 }}>
              <div className="stat-label" style={{ marginBottom: 12 }}>Récord</div>
              {stats.ganados + stats.empatados + stats.perdidos === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Todavía no cargaste resultados. Después de jugar, cargalos desde <b>Mis turnos</b>.
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 20 }}>
                    {[
                      { Icono: Trophy,    label: 'Ganados',   valor: stats.ganados,   color: 'var(--green)' },
                      { Icono: Handshake, label: 'Empates',   valor: stats.empatados, color: 'var(--muted)' },
                      { Icono: Frown,     label: 'Perdidos',  valor: stats.perdidos,  color: 'var(--error)' },
                    ].map(({ Icono, label, valor, color }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icono size={18} style={{ color }} />
                        <div>
                          <div className="display-font" style={{ fontSize: 22, lineHeight: 1, color }}>{valor}</div>
                          <div className="mono-caps" style={{ fontSize: 9, color: 'var(--muted)' }}>{label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Barra proporcional */}
                  <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', marginTop: 14, background: 'var(--surface-2)' }}>
                    {[
                      { v: stats.ganados,   c: 'var(--green)' },
                      { v: stats.empatados, c: 'var(--border-dark)' },
                      { v: stats.perdidos,  c: 'var(--error)' },
                    ].map(({ v, c }, i) => v > 0 && (
                      <div key={i} style={{ flex: v, background: c }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        <form onSubmit={handleSubmit} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="alert alert-error">{error}</div>}
          {ok    && <div className="alert alert-success">¡Perfil actualizado!</div>}

          <div className="form-group">
            <label className="form-label">Nombre completo *</label>
            <input className="form-input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
          </div>

          <div className="form-group">
            <label className="form-label">Celular</label>
            <input type="tel" inputMode="tel" className="form-input" placeholder="2494 123456" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} required />
            <p className="form-hint">Tu celular con código de área, sin el 0 ni el 15. Lo usan los dueños para coordinar la reserva.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de cuenta</label>
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--bg)', fontSize: 14, color: 'var(--muted)' }}>
              {profile?.rol === 'dueno' ? '🏟️ Dueño de cancha' : '⚽ Jugador'}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Guardando...</> : <><Save size={15} /> Guardar cambios</>}
          </button>
        </form>
      </div>
    </div>
  )
}
