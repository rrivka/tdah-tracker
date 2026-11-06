import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Routine, RoutineInput } from '../models/routine.model';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { TaskService } from './task.service';
import { TickService } from './tick.service';
import { AlarmService } from './alarm.service';
import { toDateKey } from '../utils/date.utils';
import { toTimeKey } from '../utils/time.utils';
import { compareRoutines, compareSlots, doneKey, isDoneOn, isDueOn, routineTimes } from '../utils/routine.utils';

/** Cuántas marcas de "hecho" se guardan por actividad (para no crecer sin límite). */
const MAX_DONE_DATES = 200;

/**
 * Una fila de la lista del día: una actividad en uno de sus horarios
 * (o la actividad completa si no tiene horario).
 */
export interface RoutineForDay {
  routine: Routine;
  /** Horario "HH:MM" de esta fila, o undefined si la actividad no tiene horario. */
  slot?: string;
  done: boolean;
}

/**
 * RoutineService: actividades constantes (medicación, hábitos…).
 * Igual que TaskService: usa StorageService para guardar y nunca habla con Firebase directamente.
 *
 * Además revisa cada minuto los recordatorios: si una actividad tiene hora y "Avisarme",
 * y a esa hora todavía no está hecha, suena como una alarma (solo con la app abierta).
 */
@Injectable({ providedIn: 'root' })
export class RoutineService {
  private readonly auth = inject(AuthService);
  private readonly storage = inject(StorageService);
  private readonly tick = inject(TickService);
  private readonly alarms = inject(AlarmService);
  /** Reutilizamos su `today` y su signal de error. */
  private readonly tasks = inject(TaskService);

  private readonly _routines = signal<Routine[]>([]);

  readonly loading = signal(true);

  /** Todas las actividades, ordenadas por hora. */
  readonly routines = computed(() => [...this._routines()].sort(compareRoutines));

  /** Las que tocan hoy, con su estado (hecha o no). */
  readonly today = computed<RoutineForDay[]>(() => this.forDate(this.tasks.today()));

  /** Cuántas faltan hoy. */
  readonly pendingToday = computed(() => this.today().filter((r) => !r.done).length);

  /** Para no avisar dos veces en el mismo minuto: id → "YYYY-MM-DD HH:MM". */
  private readonly reminded = new Map<string, string>();

  constructor() {
    // Escuchar las actividades del usuario actual (igual que TaskService con los pendientes).
    effect((onCleanup) => {
      const user = this.auth.user();
      this._routines.set([]);
      if (!user) return;
      this.loading.set(true);
      const unsubscribe = this.storage.watchRoutines(
        user.uid,
        (routines) => {
          this._routines.set(routines);
          this.loading.set(false);
        },
        (e) => {
          this.tasks.error.set('No se pudieron cargar las actividades: ' + e.message);
          this.loading.set(false);
        },
      );
      onCleanup(unsubscribe);
    });

    // Recordatorios.
    effect(() => {
      const now = this.tick.now();
      untracked(() => this.checkReminders(now));
    });
  }

  /**
   * Filas del día `dateKey`: una por cada horario de cada actividad que toca ese día
   * (o una sola fila si no tiene horario). Ordenadas por hora.
   */
  forDate(dateKey: string): RoutineForDay[] {
    const rows: RoutineForDay[] = [];
    for (const routine of this.routines()) {
      if (!isDueOn(routine, dateKey)) continue;
      const times = routineTimes(routine);
      if (times.length === 0) {
        rows.push({ routine, done: isDoneOn(routine, dateKey) });
      } else {
        for (const slot of times) rows.push({ routine, slot, done: isDoneOn(routine, dateKey, slot) });
      }
    }
    return rows.sort((a, b) => compareSlots(a.slot, b.slot) || a.routine.title.localeCompare(b.routine.title, 'es'));
  }

  add(input: RoutineInput): void {
    const uid = this.uid();
    const now = new Date().toISOString();
    this.persist(
      this.storage.saveRoutine(uid, {
        id: this.storage.newRoutineId(uid),
        ...normalize(input),
        doneDates: [],
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  update(id: string, input: RoutineInput): void {
    const current = this.find(id);
    if (!current) return;
    this.persist(
      this.storage.saveRoutine(this.uid(), {
        ...current,
        ...normalize(input),
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  remove(id: string): void {
    this.persist(this.storage.deleteRoutine(this.uid(), id));
  }

  /** Vuelve a guardar una actividad tal como estaba (para "Deshacer"). */
  restore(routine: Routine): void {
    this.persist(this.storage.saveRoutine(this.uid(), routine));
  }

  /** Marca o desmarca como hecha en un día y, si se indica, en un horario concreto. */
  toggleDone(id: string, dateKey: string, slot?: string): void {
    const r = this.find(id);
    if (!r) return;
    this.setDone(id, dateKey, !isDoneOn(r, dateKey, slot), slot);
  }

  /** Marca como hecha (o no) en un día y, si se indica, en un horario concreto. */
  setDone(id: string, dateKey: string, done: boolean, slot?: string): void {
    const r = this.find(id);
    if (!r) return;
    const key = doneKey(dateKey, slot);
    // Al desmarcar quitamos también una marca vieja del día completo, si la hubiera.
    const others = r.doneDates.filter((d) => d !== key && !(slot && !done && d === dateKey));
    const doneDates = (done ? [...others, key] : others).sort().slice(-MAX_DONE_DATES);
    this.persist(this.storage.saveRoutine(this.uid(), { ...r, doneDates, updatedAt: new Date().toISOString() }));
  }

  /** Lista para el respaldo JSON. */
  exportList(): Routine[] {
    return this.routines();
  }

  /** Importa actividades de un respaldo (reemplaza las de mismo id). Devuelve cuántas. */
  importList(list: unknown[]): number {
    const uid = this.uid();
    const now = new Date().toISOString();
    const routines: Routine[] = [];
    for (const raw of list as Record<string, unknown>[]) {
      if (!raw || typeof raw !== 'object' || typeof raw['title'] !== 'string' || !raw['title'].trim()) continue;
      const frequency = ['daily', 'weekdays', 'interval'].includes(raw['frequency'] as string)
        ? (raw['frequency'] as Routine['frequency'])
        : 'daily';
      routines.push({
        id: typeof raw['id'] === 'string' && raw['id'] ? raw['id'] : this.storage.newRoutineId(uid),
        ...normalize({
          title: raw['title'],
          description: typeof raw['description'] === 'string' ? raw['description'] : undefined,
          frequency,
          days: Array.isArray(raw['days']) ? (raw['days'] as number[]) : undefined,
          everyDays: typeof raw['everyDays'] === 'number' ? raw['everyDays'] : undefined,
          startDate: typeof raw['startDate'] === 'string' ? raw['startDate'] : this.tasks.today(),
          // Acepta el formato nuevo (times) y el viejo (time).
          times: Array.isArray(raw['times'])
            ? (raw['times'] as string[])
            : typeof raw['time'] === 'string'
              ? [raw['time']]
              : [],
          remind: raw['remind'] === true,
        }),
        doneDates: Array.isArray(raw['doneDates']) ? (raw['doneDates'] as string[]).slice(-MAX_DONE_DATES) : [],
        createdAt: typeof raw['createdAt'] === 'string' ? raw['createdAt'] : now,
        updatedAt: typeof raw['updatedAt'] === 'string' ? raw['updatedAt'] : now,
      });
    }
    if (routines.length) this.persist(this.storage.saveManyRoutines(uid, routines));
    return routines.length;
  }

  // ---- privados ----

  private checkReminders(now: number): void {
    const date = new Date(now);
    const minute = toTimeKey(date);
    const dateKey = toDateKey(date);
    for (const r of this._routines()) {
      // ¿Tiene aviso y uno de sus horarios es justo este minuto?
      if (!r.remind || !routineTimes(r).includes(minute)) continue;
      if (!isDueOn(r, dateKey) || isDoneOn(r, dateKey, minute)) continue;
      const key = `${dateKey} ${minute}`;
      if (this.reminded.get(r.id) === key) continue;
      this.reminded.set(r.id, key);
      this.alarms.ring({
        id: 'routine-' + r.id,
        time: minute,
        label: r.title,
        enabled: true,
        repeat: true,
        routineId: r.id,
      });
    }
  }

  private find(id: string): Routine | undefined {
    return this._routines().find((r) => r.id === id);
  }

  private uid(): string {
    const user = this.auth.user();
    if (!user) throw new Error('No hay sesión iniciada.');
    return user.uid;
  }

  private persist(promise: Promise<void>): void {
    this.tasks.error.set(null);
    promise.catch((e: Error) => this.tasks.error.set('No se pudo guardar: ' + e.message));
  }
}

/** Limpia los datos del formulario: quita lo que no aplica a la frecuencia elegida. */
function normalize(input: RoutineInput): RoutineInput & { time?: undefined } {
  // Horarios válidos, sin repetidos y ordenados.
  const times = [...new Set((input.times ?? []).filter((t) => /^\d{2}:\d{2}$/.test(t)))].sort();
  const description = input.description?.trim() || undefined;
  return {
    title: input.title.trim(),
    description,
    frequency: input.frequency,
    days: input.frequency === 'weekdays' ? [...new Set(input.days ?? [])].sort() : undefined,
    everyDays: input.frequency === 'interval' ? Math.max(1, Math.round(input.everyDays ?? 1)) : undefined,
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(input.startDate) ? input.startDate : toDateKey(new Date()),
    times,
    // Borra el campo viejo `time` al guardar (ya se usa `times`).
    time: undefined,
    remind: times.length > 0 && input.remind,
  };
}
