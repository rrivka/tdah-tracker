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

  /** Hora "HH:MM" opcional. Sin hora = "en cualquier momento del día". */
  time?: string;
  /** Si tiene hora: sonar a esa hora si todavía no está hecha. */
  remind: boolean;

  /** Días en que se marcó como hecha ("YYYY-MM-DD"). Se guardan solo los más recientes. */
  doneDates: string[];

  createdAt: string;
  updatedAt: string;
}

export type RoutineFrequency = 'daily' | 'weekdays' | 'interval';

/** Datos que el usuario llena en el formulario. */
export type RoutineInput = Pick<
  Routine,
  'title' | 'description' | 'frequency' | 'days' | 'everyDays' | 'startDate' | 'time' | 'remind'
>;
