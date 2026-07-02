import { describe, it, expect } from 'vitest'
import { timeToHour, hourToTime, TIPO_LABEL, TIPO_DB } from './tipoCancha'

describe('conversión de horas', () => {
  it('timeToHour extrae la hora de un string TIME', () => {
    expect(timeToHour('20:00:00')).toBe(20)
    expect(timeToHour('08:30:00')).toBe(8)
  })

  it('hourToTime formatea con dos dígitos', () => {
    expect(hourToTime(8)).toBe('08:00:00')
    expect(hourToTime(20)).toBe('20:00:00')
  })

  it('ida y vuelta es consistente', () => {
    expect(timeToHour(hourToTime(14))).toBe(14)
  })
})

describe('mapeo de tipos de cancha', () => {
  it('TIPO_DB y TIPO_LABEL son inversos', () => {
    expect(TIPO_LABEL[TIPO_DB['Fútbol 5']]).toBe('Fútbol 5')
    expect(TIPO_LABEL[TIPO_DB['Fútbol 11']]).toBe('Fútbol 11')
  })
})
