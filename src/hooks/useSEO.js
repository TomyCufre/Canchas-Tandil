import { useEffect } from 'react'

const BASE_TITLE = 'Canchas Tandil'
const BASE_DESC  = 'Reservá canchas de fútbol en Tandil, Buenos Aires. Fútbol 5, 6, 7, 8 y 11. Turnos online en segundos.'

export function useSEO({ title, description, image } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE
    document.title = fullTitle

    setMeta('description', description || BASE_DESC)
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', description || BASE_DESC, true)
    setMeta('og:type', 'website', true)
    if (image) setMeta('og:image', image, true)

    return () => { document.title = BASE_TITLE }
  }, [title, description, image])
}

function setMeta(name, content, isOg = false) {
  const attr = isOg ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
