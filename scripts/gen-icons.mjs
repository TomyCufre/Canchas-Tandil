// Genera los íconos PNG de la PWA sin dependencias externas.
// Dibuja un cuadrado verde con una pelota de fútbol estilizada.
import zlib from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const GREEN = [22, 163, 74]
const WHITE = [255, 255, 255]
const DARK  = [15, 23, 42]

// --- CRC32 / PNG encoding ---
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit, RGBA
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filtro none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// --- geometría ---
function pointInPolygon(px, py, pts) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]
    if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)) inside = !inside
  }
  return inside
}
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function pentagon(cx, cy, r, rot = -Math.PI / 2) {
  return Array.from({ length: 5 }, (_, i) => {
    const a = rot + (i * 2 * Math.PI) / 5
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  })
}

// color de un punto (coords normalizadas 0..1), con AA por supersampling
function colorAt(nx, ny, maskable) {
  const cx = 0.5, cy = 0.5
  const ballR = 0.34
  const pent = pentagon(cx, cy, 0.12)
  const d = Math.hypot(nx - cx, ny - cy)

  // fondo (cuadrado redondeado para "any"; full-bleed para maskable)
  let bg = null
  if (maskable) {
    bg = GREEN
  } else {
    const r = 0.16
    const inX = nx > r && nx < 1 - r, inY = ny > r && ny < 1 - r
    let inside = inX || inY
    if (!inside) {
      const ccx = nx < r ? r : 1 - r, ccy = ny < r ? r : 1 - r
      inside = Math.hypot(nx - ccx, ny - ccy) <= r
    }
    bg = inside ? GREEN : null
  }
  if (!bg) return [0, 0, 0, 0]

  // segmentos negros (costuras) desde vértices del pentágono hacia afuera
  for (const [vx, vy] of pent) {
    const dirx = vx - cx, diry = vy - cy
    const len = Math.hypot(dirx, diry)
    const ex = cx + (dirx / len) * (ballR - 0.01), ey = cy + (diry / len) * (ballR - 0.01)
    if (d < ballR - 0.005 && distToSeg(nx, ny, vx, vy, ex, ey) < 0.012) return [...DARK, 255]
  }
  // pentágono central negro
  if (pointInPolygon(nx, ny, pent)) return [...DARK, 255]
  // pelota blanca
  if (d <= ballR) return [...WHITE, 255]
  return [...bg, 255]
}

function render(size, maskable) {
  const buf = Buffer.alloc(size * size * 4)
  const SS = 2 // supersampling
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const nx = (x + (sx + 0.5) / SS) / size, ny = (y + (sy + 0.5) / SS) / size
        const c = colorAt(nx, ny, maskable)
        r += c[0]; g += c[1]; b += c[2]; a += c[3]
      }
      const n = SS * SS, i = (y * size + x) * 4
      buf[i] = r / n; buf[i + 1] = g / n; buf[i + 2] = b / n; buf[i + 3] = a / n
    }
  }
  return encodePng(size, size, buf)
}

mkdirSync('public', { recursive: true })
writeFileSync('public/icon-192.png', render(192, false))
writeFileSync('public/icon-512.png', render(512, false))
writeFileSync('public/icon-512-maskable.png', render(512, true))
console.log('Íconos generados: icon-192.png, icon-512.png, icon-512-maskable.png')
