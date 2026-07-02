// Devuelve una fecha en formato YYYY-MM-DD usando la hora LOCAL del navegador.
// (No usar toISOString(), que devuelve UTC y adelanta el día a la noche en Argentina.)
export function fechaLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
