import { describe, it, expect } from 'vitest'
import { fechaLocal } from './fecha'

describe('fechaLocal', () => {
  it('formatea como YYYY-MM-DD con dos dígitos', () => {
    expect(fechaLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(fechaLocal(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('usa la fecha LOCAL: a las 23:00 sigue siendo el mismo día (no adelanta a UTC)', () => {
    const d = new Date(2026, 5, 15, 23, 0, 0) // 15 jun, 23:00 local
    expect(fechaLocal(d)).toBe('2026-06-15')
  })
})
