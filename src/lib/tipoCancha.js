// Mapeo entre valores del enum de DB y etiquetas de UI
export const TIPO_LABEL = {
  futbol5:  'Fútbol 5',
  futbol6:  'Fútbol 6',
  futbol7:  'Fútbol 7',
  futbol8:  'Fútbol 8',
  futbol11: 'Fútbol 11',
  techo:    'Techo',
  indoor:   'Indoor',
}

export const TIPO_DB = {
  'Fútbol 5':  'futbol5',
  'Fútbol 6':  'futbol6',
  'Fútbol 7':  'futbol7',
  'Fútbol 8':  'futbol8',
  'Fútbol 11': 'futbol11',
  'Techo':     'techo',
  'Indoor':    'indoor',
}

export const TIPOS_UI = Object.keys(TIPO_DB)

// Horarios: TIME string ↔ integer hour
export function timeToHour(timeStr) {
  return parseInt(timeStr.split(':')[0], 10)
}

export function hourToTime(h) {
  return `${String(h).padStart(2, '0')}:00:00`
}
