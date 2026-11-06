/**
 * Utilidades de fechas.
 * Una "dateKey" es un día en formato "YYYY-MM-DD" usando la hora LOCAL del dispositivo.
 * Como es texto con ceros a la izquierda, se puede comparar con < y > directamente.
 */

/** Convierte un Date a "YYYY-MM-DD" (hora local). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Convierte "YYYY-MM-DD" a Date (a medianoche local). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** La dateKey de hoy. */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** Formatea una dateKey para mostrarla, p. ej. "mié, 5 nov 2026". */
export function formatDateKey(key: string): string {
  return fromDateKey(key).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
