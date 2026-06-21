import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Camera, Save, User } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, setProfile } = useAuth()
  const fileInputRef = useRef()
  const [form, setForm] = useState({ nombre: profile?.nombre || '', telefono: profile?.telefono || '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState('')

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
    await supabase.from('perfiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    setProfile(p => ({ ...p, avatar_url: publicUrl }))
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError(''); setOk(false)
    const { error: err } = await supabase.from('perfiles')
      .update({ nombre: form.nombre.trim(), telefono: form.telefono.trim() || null })
      .eq('id', user.id)
    setSaving(false)
    if (err) { setError('Error al guardar'); return }
    setProfile(p => ({ ...p, nombre: form.nombre.trim(), telefono: form.telefono.trim() || null }))
    setOk(true)
    setTimeout(() => setOk(false), 3000)
  }

  const avatarUrl = profile?.avatar_url

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Mi perfil</h1>

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

        <form onSubmit={handleSubmit} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="alert alert-error">{error}</div>}
          {ok    && <div className="alert alert-success">¡Perfil actualizado!</div>}

          <div className="form-group">
            <label className="form-label">Nombre completo *</label>
            <input className="form-input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono <span style={{ color: 'var(--muted)', fontSize: 12 }}>(opcional)</span></label>
            <input className="form-input" placeholder="2494 000000" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            <p className="form-hint">Se usa para que los dueños de canchas puedan contactarte</p>
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
