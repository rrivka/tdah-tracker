/**
 * Una racha (estilo Duolingo): un hábito más grande que quieres sostener día a día,
 * como hacer ejercicio o tomar suficiente agua.
 * Se guarda en Firestore en users/{uid}/streaks/{id}.
 *
 * Diferencia con los otros tipos:
 *  - Pendiente: algo corto que se hace una vez.
 *  - Actividad constante: algo corto que se repite (medicación).
 *  - Racha: un hábito que quieres mantener; cuenta días seguidos y tiene su calendario.
 */
export interface Streak {
  id: string;
  title: string;
  /** Emoji que la representa (💪, 💧, 📚…). */
  emoji: string;
  description?: string;

  /**
   * Días de la semana en que toca (0 = domingo … 6 = sábado).
   * Los demás son de descanso: no rompen la racha.
   */
  days: number[];

  /** false = en pausa (no aparece en las tarjetas y no se rompe). */
  active: boolean;
  /** Periodos en pausa ("YYYY-MM-DD"). Sin `to` = sigue en pausa. Esos días no cuentan como fallados. */
  pauses: StreakPause[];

  /** Desde qué día cuenta ("YYYY-MM-DD"). */
  startDate: string;
  /** Días cumplidos ("YYYY-MM-DD"). Se guarda todo el historial para el calendario. */
  doneDates: string[];

  createdAt: string;
  updatedAt: string;
}

export interface StreakPause {
  from: string;
  to?: string;
}

/** Datos que el usuario llena en el formulario. */
export type StreakInput = Pick<Streak, 'title' | 'emoji' | 'description' | 'days' | 'startDate'>;

/** Estado de un día en el calendario de una racha. */
export type StreakDayStatus =
  | 'done' // cumplido
  | 'missed' // tocaba y no se hizo
  | 'today' // hoy toca y todavía no se hace
  | 'rest' // día de descanso
  | 'paused' // en pausa
  | 'future' // todavía no llega
  | 'before'; // antes de empezar la racha
