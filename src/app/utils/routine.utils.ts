import { Routine } from '../models/routine.model';
import { fromDateKey, toDateKey } from './date.utils';

/** Días de la semana en orden lunes → domingo, con su número de Date.getDay(). */
export const WEEKDAYS: { value: number; short: string; name: string }[] = [
  { value: 1, short: 'L', name: 'lunes' },
  { value: 2, short: 'M', name: 'martes' },
  { value: 3, short: 'X', name: 'miércoles' },
  { value: 4, short: 'J', name: 'jueves' },
  { value: 5, short: 'V', name: 'viernes' },
  { value: 6, short: 'S', name: 'sábado' },
  { value: 0, short: 'D', name: 'domingo' },
];

/** ¿Toca hacer esta actividad el día `dateKey` ("YYYY-MM-DD")? */
export function isDueOn(routine: Routine, dateKey: string): boolean {
  if (dateKey < routine.startDate) return false;
  switch (routine.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return (routine.days ?? []).includes(fromDateKey(dateKey).getDay());
    case 'interval': {
      const every = Math.max(1, routine.everyDays ?? 1);
      return daysBetween(routine.startDate, dateKey) % every === 0;
    }
  }
}

/** Horarios de una actividad (acepta el formato viejo de un solo `time`). */
export function routineTimes(routine: Routine): string[] {
  if (routine.times?.length) return routine.times;
  return routine.time ? [routine.time] : [];
}

/** Clave de "hecho": "YYYY-MM-DD" o "YYYY-MM-DD HH:MM" si es un horario concreto. */
export function doneKey(dateKey: string, slot?: string): string {
  return slot ? `${dateKey} ${slot}` : dateKey;
}

/**
 * ¿Está hecha ese día (y en ese horario, si se indica)?
 * Una marca del día completo ("YYYY-MM-DD") cuenta para todos sus horarios.
 */
export function isDoneOn(routine: Routine, dateKey: string, slot?: string): boolean {
  return routine.doneDates.includes(dateKey) || (!!slot && routine.doneDates.includes(doneKey(dateKey, slot)));
}

/** Texto de la frecuencia: "Todos los días", "L, X, V", "Cada 3 días". */
export function frequencyLabel(routine: Routine): string {
  switch (routine.frequency) {
    case 'daily':
      return 'Todos los días';
    case 'weekdays': {
      const days = routine.days ?? [];
      if (days.length === 7) return 'Todos los días';
      return WEEKDAYS.filter((d) => days.includes(d.value))
        .map((d) => d.short)
        .join(', ');
    }
    case 'interval': {
      const every = routine.everyDays ?? 1;
      return every === 1 ? 'Todos los días' : `Cada ${every} días`;
    }
  }
}

/** Próximo día (desde `fromKey`, incluido) en que toca. null si no encuentra en un año. */
export function nextDueDate(routine: Routine, fromKey: string): string | null {
  const date = fromDateKey(fromKey);
  for (let i = 0; i < 366; i++) {
    const key = toDateKey(date);
    if (isDueOn(routine, key)) return key;
    date.setDate(date.getDate() + 1);
  }
  return null;
}

/** Ordena por primer horario (las que no tienen horario van al final) y luego por título. */
export function compareRoutines(a: Routine, b: Routine): number {
  return compareSlots(routineTimes(a)[0], routineTimes(b)[0]) || a.title.localeCompare(b.title, 'es');
}

/** Compara dos horarios "HH:MM"; sin horario va al final. */
export function compareSlots(a: string | undefined, b: string | undefined): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : 1;
}

/** Días completos entre dos dateKeys (b - a). */
function daysBetween(a: string, b: string): number {
  // Usamos mediodía para evitar problemas con el cambio de horario.
  const da = fromDateKey(a);
  const db = fromDateKey(b);
  da.setHours(12);
  db.setHours(12);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}
