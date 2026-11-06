/**
 * Una actividad constante (algo que se repite: medicación, ejercicio, regar plantas…).
 * Se guarda en Firestore en users/{uid}/routines/{id}.
 */
export interface Routine {
  id: string;
  title: string;
  description?: string;

  /**
   * Cada cuándo se hace:
   *  - 'daily'    → todos los días
   *  - 'weekdays' → solo los días de `days`
   *  - 'interval' → cada `everyDays` días, contando desde `startDate`
   */
  frequency: RoutineFrequency;
  /** Días de la semana (solo 'weekdays'). 0 = domingo, 1 = lunes … 6 = sábado. */
  days?: number[];
  /** Cada cuántos días (solo 'interval'). */
  everyDays?: number;
  /** Desde qué día cuenta ("YYYY-MM-DD"). */
  startDate: string;

  /**
   * Horarios "HH:MM" del día, ordenados (p. ej. ["08:00", "21:00"]).
   * Vacío o ausente = sin horario ("en cualquier momento del día").
   */
  times?: string[];
  /** @deprecated Versión anterior (un solo horario). Se lee como times = [time]. */
  time?: string;
  /** Si tiene horarios: sonar en cada uno si todavía no está hecho. */
  remind: boolean;

  /**
   * Lo que se marcó como hecho (se guardan solo los más recientes):
   *  - "YYYY-MM-DD"        → hecha ese día (actividades sin horario)
   *  - "YYYY-MM-DD HH:MM"  → hecho ese horario de ese día
   */
  doneDates: string[];

  createdAt: string;
  updatedAt: string;
}

export type RoutineFrequency = 'daily' | 'weekdays' | 'interval';

/** Datos que el usuario llena en el formulario. */
export type RoutineInput = Pick<
  Routine,
  'title' | 'description' | 'frequency' | 'days' | 'everyDays' | 'startDate' | 'times' | 'remind'
>;
