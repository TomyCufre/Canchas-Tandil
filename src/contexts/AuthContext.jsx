import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase.from('perfiles').select('id, nombre, rol, avatar_url, created_at, es_admin').eq('id', userId).single()
    // El teléfono no es legible directamente (privacidad); se trae por RPC segura
    const { data: telefono } = await supabase.rpc('get_mi_telefono')
    setProfile(data ? { ...data, telefono: telefono ?? null } : data)
    setLoading(false)
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  // Datos del perfil van como metadata → el trigger on_auth_user_created los usa
  // para insertar en `perfiles` con security definer (evita problemas de RLS con confirmación de email)
  async function signUp({ nombre, email, password, telefono, quiereDueno, nombreComplejo }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          telefono: telefono || null,
          // El rol NUNCA se asigna desde el cliente: la base siempre crea "jugador".
          // Si pide ser dueño, se registra una solicitud pendiente de aprobación.
          quiere_dueno: quiereDueno ? 'true' : 'false',
          nombre_complejo: nombreComplejo || null,
        },
      },
    })
    if (error) return { error, needsConfirmation: false }

    const needsConfirmation = !!data.user && !data.session
    return { error: null, needsConfirmation }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
