// Genera public/sitemap.xml con las páginas fijas + cada cancha activa.
// Corre antes del build (ver package.json). Si no hay conexión/env, deja el sitemap base.
import { writeFileSync, readFileSync, existsSync } from 'node:fs'

const BASE = 'https://canchas-tandil.vercel.app'

// Env: en Vercel vienen por process.env; localmente los leemos de .env.local
function getEnv(name) {
  if (process.env[name]) return process.env[name]
  try {
    if (existsSync('.env.local')) {
      const line = readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith(name + '='))
      if (line) return line.slice(name.length + 1).trim()
    }
  } catch { /* ignore */ }
  return null
}

const URL = getEnv('VITE_SUPABASE_URL')
const KEY = getEnv('VITE_SUPABASE_ANON_KEY')

let canchas = []
if (URL && KEY) {
  try {
    const res = await fetch(`${URL}/rest/v1/canchas?select=id&activa=eq.true`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    })
    if (res.ok) canchas = await res.json()
  } catch { /* sin red: seguimos con el sitemap base */ }
}

const paginas = [
  { loc: `${BASE}/`, changefreq: 'daily', priority: '1.0' },
  { loc: `${BASE}/register`, changefreq: 'monthly', priority: '0.4' },
  { loc: `${BASE}/login`, changefreq: 'monthly', priority: '0.3' },
  { loc: `${BASE}/terminos`, changefreq: 'yearly', priority: '0.2' },
  { loc: `${BASE}/privacidad`, changefreq: 'yearly', priority: '0.2' },
  ...canchas.map(c => ({ loc: `${BASE}/canchas/${c.id}`, changefreq: 'weekly', priority: '0.7' })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paginas.map(p => `  <url>
    <loc>${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>
`

writeFileSync('public/sitemap.xml', xml)
console.log(`Sitemap generado: ${paginas.length} URLs (${canchas.length} canchas)`)
