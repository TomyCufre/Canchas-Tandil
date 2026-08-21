import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const CLAVE = 'canchas-tandil-tema'

function temaInicial() {
  if (typeof window === 'undefined') return 'light'
  const guardado = localStorage.getItem(CLAVE)
  if (guardado === 'light' || guardado === 'dark') return guardado
  // Sin preferencia guardada: seguimos la del sistema
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', tema === 'dark')
    localStorage.setItem(CLAVE, tema)
    // La barra del navegador/PWA acompaña al tema
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', tema === 'dark' ? '#0c1322' : '#faf8ff')
  }, [tema])

  // Si el usuario nunca eligió, seguimos los cambios del sistema
  useEffect(() => {
    if (localStorage.getItem(CLAVE)) return
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = e => setTema(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const alternarTema = () => setTema(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ tema, setTema, alternarTema, esOscuro: tema === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
