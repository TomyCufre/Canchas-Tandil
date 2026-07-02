// Genera la imagen Open Graph (1200x630) para previews de WhatsApp/redes.
// Sin dependencias: verde con degradado + pelota de fútbol blanca.
import zlib from 'node:zlib'
import { writeFileSync } from 'node:fs'

const GREEN = [22, 163, 74]
const GREEN_DARK = [21, 128, 61]
const WHITE = [255, 255, 255]
const DARK = [15, 23, 42]

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()
const crc32 = buf => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePng(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6
  const stride = w * 4, raw = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride) }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

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
const pentagon = (cx, cy, r, rot = -Math.PI / 2) =>
  Array.from({ length: 5 }, (_, i) => { const a = rot + (i * 2 * Math.PI) / 5; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] })

const W = 1200, H = 630, SS = 2
const cx = W / 2, cy = H / 2, ballR = 210
const pent = pentagon(cx, cy, 75)

function colorAt(x, y) {
  // fondo con degradado vertical
  const t = y / H
  const bg = [
    Math.round(GREEN[0] + (GREEN_DARK[0] - GREEN[0]) * t),
    Math.round(GREEN[1] + (GREEN_DARK[1] - GREEN[1]) * t),
    Math.round(GREEN[2] + (GREEN_DARK[2] - GREEN[2]) * t),
  ]
  const d = Math.hypot(x - cx, y - cy)
  // costuras
  for (const [vx, vy] of pent) {
    const dirx = vx - cx, diry = vy - cy, len = Math.hypot(dirx, diry)
    const ex = cx + (dirx / len) * (ballR - 6), ey = cy + (diry / len) * (ballR - 6)
    if (d < ballR - 3 && distToSeg(x, y, vx, vy, ex, ey) < 7) return [...DARK, 255]
  }
  if (pointInPolygon(x, y, pent)) return [...DARK, 255]
  if (d <= ballR) return [...WHITE, 255]
  return [...bg, 255]
}

const buf = Buffer.alloc(W * H * 4)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  let r = 0, g = 0, b = 0, a = 0
  for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
    const c = colorAt(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS)
    r += c[0]; g += c[1]; b += c[2]; a += c[3]
  }
  const n = SS * SS, i = (y * W + x) * 4
  buf[i] = r / n; buf[i + 1] = g / n; buf[i + 2] = b / n; buf[i + 3] = a / n
}

writeFileSync('public/og-image.png', encodePng(W, H, buf))
console.log('Generado public/og-image.png (1200x630)')
