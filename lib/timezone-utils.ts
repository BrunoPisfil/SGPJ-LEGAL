/**
 * Utilidades para manejo de timezones en el frontend
 * La aplicación usa America/Lima (UTC-5) como timezone
 */

/**
 * Formatear un string de fecha ISO (ejemplo: "2025-02-09") 
 * Evitando problemas de timezone al mostrar fechas
 */
export function formatearFechaConTZ(fechaIso: string): Date {
  // Si es un string ISO como "2025-02-09", crear la fecha como si fuera hora local de Perú
  // Esto evita que JavaScript la interprete como UTC
  const [año, mes, día] = fechaIso.split('-').map(Number);
  return new Date(año, mes - 1, día);
}

/**
 * Convertir una fecha a formato para enviar al backend (YYYY-MM-DD)
 */
export function fechaAString(fecha: Date): string {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const día = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${día}`;
}

/**
 * Obtener la hora actual en formato HH:MM
 */
export function obtenerHoraActual(): string {
  const ahora = new Date();
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

/**
 * Convertir string HH:MM a Date (para form fields)
 */
export function horaADate(horaString: string): Date {
  const [horas, minutos] = horaString.split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(horas, minutos, 0, 0);
  return fecha;
}

/**
 * Obtener fecha/hora actual en formato que entiende el backend
 */
export function obtenerAhoraEnPeru() {
  // Nota: En realidad obtenemos la hora del cliente, pero formateada correctamente
  // El backend convertirá a la zona horaria de Perú si es necesario
  const ahora = new Date();
  return ahora.toISOString();
}
