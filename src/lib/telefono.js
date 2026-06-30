// Normaliza un teléfono argentino a sus 10 dígitos nacionales (área + abonado).
// Acepta formatos con +54, 9, 0 y 15. Devuelve null si no es válido.
export function normalizarTelefono(raw) {
  let n = (raw || '').replace(/\D/g, '')
  if (n.startsWith('54')) n = n.slice(2)   // código de país
  if (n.startsWith('9')) n = n.slice(1)    // prefijo de celular internacional
  if (n.startsWith('0')) n = n.slice(1)    // 0 de área
  // sacar el "15" de celular viejo si quedó después del código de área
  n = n.replace(/^(\d{2,4})15(\d{6,8})$/, '$1$2')
  if (n.length !== 10) return null         // Argentina: 10 dígitos nacionales
  if (/^(\d)\1{9}$/.test(n)) return null    // rechazar todos iguales
  return n
}
