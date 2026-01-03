/**
 * Utilidades de formateo para Perú (es-PE)
 */

// Formatear moneda en soles peruanos
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Formatear fecha
export function formatDate(date: Date | string): string {
  let d: Date
  
  if (typeof date === "string") {
    // Si es un string de solo fecha (YYYY-MM-DD), ajustarlo para Lima timezone
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Crear fecha asumiendo que es medianoche en Lima, no en UTC
      const [year, month, day] = date.split('-').map(Number)
      d = new Date(year, month - 1, day, 0, 0, 0, 0)
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Lima",
  }).format(d)
}

// Formatear fecha y hora
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  }).format(d)
}

// Formatear solo hora
export function formatTime(date: Date | string): string {
  let d: Date
  
  if (typeof date === "string") {
    // Si es un string de tiempo como "14:30:00", crear una fecha temporal para hoy
    if (date.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      d = new Date(`${today}T${date}`)
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  
  // Verificar si la fecha es válida
  if (isNaN(d.getTime())) {
    return date.toString() // Retornar el string original si no se puede parsear
  }
  
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  }).format(d)
}

export function daysBetween(date1: Date, date2: Date = new Date()): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}
