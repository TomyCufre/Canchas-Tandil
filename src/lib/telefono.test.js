import { describe, it, expect } from 'vitest'
import { normalizarTelefono } from './telefono'

describe('normalizarTelefono', () => {
  it('acepta el formato local de 10 dígitos', () => {
    expect(normalizarTelefono('2494 123456')).toBe('2494123456')
  })

  it('quita el código de país +54 y el 9 de celular', () => {
    expect(normalizarTelefono('+54 9 249 412 3456')).toBe('2494123456')
  })

  it('quita el 0 de área y el 15 de celular viejo', () => {
    expect(normalizarTelefono('0249 15 4123456')).toBe('2494123456')
  })

  it('rechaza números demasiado cortos', () => {
    expect(normalizarTelefono('123')).toBeNull()
  })

  it('rechaza números con todos los dígitos iguales', () => {
    expect(normalizarTelefono('0000000000')).toBeNull()
  })

  it('rechaza vacío, null o undefined', () => {
    expect(normalizarTelefono('')).toBeNull()
    expect(normalizarTelefono(null)).toBeNull()
    expect(normalizarTelefono(undefined)).toBeNull()
  })
})
