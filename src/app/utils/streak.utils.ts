import { Streak, StreakDayStatus } from '../models/streak.model';
import { fromDateKey, toDateKey } from './date.utils';

/** Límite de seguridad para los recorridos día por día (≈ 10 años). */
const MAX_DAYS = 3650;

/** ¿Ese día estaba en pausa? */
export function isPausedOn(s: Streak, key: string): boolean {
  return s.pauses.some((p) => key >= p.from && (!p.to || key <= p.to));
}

/** ¿Ese día tocaba hacerla? (dentro del periodo, en uno de sus días y sin pausa) */
export function isScheduled(s: Streak, key: string): boolean {
  return key >= s.startDate && s.days.includes(fromDateKey(key).getDay()) && !isPausedOn(s, key);
}

export function isDone(s: Streak, key: string): boolean {
  return s.doneDates.includes(key);
}

/**
 * Racha actual: cuántos días cumplidos seguidos, contando hacia atrás desde hoy.
 * - Los días de descanso y en pausa se saltan (no rompen).
 * - Si hoy toca y aún no se hace, no rompe todavía (tienes hasta la medianoche).
 * - Un día de descanso en que sí lo hiciste cuenta como extra.
 */
export function currentStreak(s: Streak, today: string): number {
  let count = 0;
  const date = fromDateKey(today);
  for (let i = 0; i < MAX_DAYS; i++) {
    const key = toDateKey(date);
    if (key < s.startDate) break;
    if (isDone(s, key)) count++;
    else if (isScheduled(s, key) && key !== today) break;
    date.setDate(date.getDate() - 1);
  }
  return count;
}

/** Mejor racha de toda la historia. */
export function bestStreak(s: Streak, today: string): number {
  let best = 0;
  let run = 0;
  const date = fromDateKey(s.startDate);
  for (let i = 0; i < MAX_DAYS; i++) {
    const key = toDateKey(date);
    if (key > today) break;
    if (isDone(s, key)) best = Math.max(best, ++run);
    else if (isScheduled(s, key) && key !== today) run = 0;
    date.setDate(date.getDate() + 1);
  }
  return best;
}

/** Estado de un día (para el calendario y los puntitos de la semana). */
export function dayStatus(s: Streak, key: string, today: string): StreakDayStatus {
  if (isDone(s, key)) return 'done';
  if (key < s.startDate) return 'before';
  if (key > today) return 'future';
  if (isPausedOn(s, key)) return 'paused';
  if (!s.days.includes(fromDateKey(key).getDay())) return 'rest';
  return key === today ? 'today' : 'missed';
}

/** Los últimos `n` días (terminando hoy) con su estado. */
export function lastDays(s: Streak, today: string, n = 7): { key: string; status: StreakDayStatus }[] {
  const result: { key: string; status: StreakDayStatus }[] = [];
  const date = fromDateKey(today);
  date.setDate(date.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const key = toDateKey(date);
    result.push({ key, status: dayStatus(s, key, today) });
    date.setDate(date.getDate() + 1);
  }
  return result;
}

/** Texto amable del estado de hoy. */
export function todayLabel(s: Streak, today: string): string {
  switch (dayStatus(s, today, today)) {
    case 'done':
      return '¡Hecho hoy!';
    case 'today':
      return 'Hoy toca';
    case 'rest':
      return 'Hoy descansas';
    case 'paused':
      return 'En pausa';
    default:
      return '';
  }
}

/** Emojis sugeridos en el formulario. */
export const STREAK_EMOJIS = ['💪', '🏃', '💧', '🧘', '📚', '🥗', '😴', '🧹', '✍️', '🎸', '🚶', '🦷'];
