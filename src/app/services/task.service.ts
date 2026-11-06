import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Task, TaskFilter, TaskInput } from '../models/task.model';
import { todayKey } from '../utils/date.utils';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';

/** Resumen por día que usa el calendario. */
export interface DaySummary {
  pending: number;
  completed: number;
}

/** Todos los filtros, en el orden en que aparecen en pantalla. */
export const TASK_FILTERS: { id: TaskFilter; label: string }[] = [
  { id: 'all', label: 'Pendientes' },
  { id: 'today', label: 'Hoy' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'overdue', label: 'Vencidos' },
  { id: 'no-date', label: 'Sin fecha' },
  { id: 'completed', label: 'Completados' },
];

/**
 * TaskService: toda la lógica de pendientes, con signals.
 * Usa StorageService para guardar; nunca habla con Firebase directamente.
 *
 * Los componentes leen los signals (tasks, filteredTasks, ...) y llaman a los métodos
 * (add, update, toggle, remove, ...). Cuando algo cambia en Firestore, onSnapshot actualiza
 * `_tasks` y todos los `computed` se recalculan solos.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly auth = inject(AuthService);
  private readonly storage = inject(StorageService);

  private readonly _tasks = signal<Task[]>([]);

  /** true mientras llega la primera carga de pendientes. */
  readonly loading = signal(true);
  /** Último error (para mostrarlo en pantalla), o null. */
  readonly error = signal<string | null>(null);

  /** Día de hoy ("YYYY-MM-DD"). Se revisa cada minuto por si pasa la medianoche. */
  readonly today = signal(todayKey());

  /** Filtro activo de la lista. */
  readonly filter = signal<TaskFilter>('all');

  /** Todos los pendientes, ordenados: sin completar primero, luego por fecha. */
  readonly tasks = computed(() => [...this._tasks()].sort(compareTasks));

  /** Pendientes que cumplen el filtro activo. */
  readonly filteredTasks = computed(() => {
    const filter = this.filter();
    const today = this.today();
    return this.tasks().filter((t) => matchesFilter(t, filter, today));
  });

  /** Cuántos pendientes hay en cada filtro (el número que sale en cada botón). */
  readonly counts = computed(() => {
    const today = this.today();
    const tasks = this.tasks();
    const result = {} as Record<TaskFilter, number>;
    for (const f of TASK_FILTERS) {
      result[f.id] = tasks.filter((t) => matchesFilter(t, f.id, today)).length;
    }
    return result;
  });

  /** Mapa "YYYY-MM-DD" → resumen, solo de los pendientes con fecha (para el calendario). */
  readonly summaryByDate = computed(() => {
    const map = new Map<string, DaySummary>();
    for (const t of this._tasks()) {
      if (!t.dueDate) continue;
      const s = map.get(t.dueDate) ?? { pending: 0, completed: 0 };
      if (t.completed) s.completed++;
      else s.pending++;
      map.set(t.dueDate, s);
    }
    return map;
  });

  constructor() {
    // Cada vez que cambia el usuario, empezamos a escuchar SUS pendientes
    // (y dejamos de escuchar los del usuario anterior).
    effect((onCleanup) => {
      const user = this.auth.user();
      this._tasks.set([]);
      if (!user) return;

      this.loading.set(true);
      const unsubscribe = this.storage.watchTasks(
        user.uid,
        (tasks) => {
          this._tasks.set(tasks);
          this.loading.set(false);
        },
        (e) => {
          this.error.set('No se pudieron cargar los pendientes: ' + e.message);
          this.loading.set(false);
        },
      );
      onCleanup(unsubscribe);
    });

    setInterval(() => this.today.set(todayKey()), 60_000);
  }

  /** Pendientes de un día concreto. */
  tasksForDate(dateKey: string): Task[] {
    return this.tasks().filter((t) => t.dueDate === dateKey);
  }

  add(input: TaskInput): void {
    const uid = this.uid();
    const now = new Date().toISOString();
    this.persist(
      this.storage.saveTask(uid, {
        id: this.storage.newTaskId(uid),
        ...normalizeInput(input),
        completed: false,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  update(id: string, input: TaskInput): void {
    const task = this.find(id);
    if (!task) return;
    this.persist(
      this.storage.saveTask(this.uid(), {
        id,
        ...normalizeInput(input),
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  toggle(id: string): void {
    const task = this.find(id);
    if (!task) return;
    this.persist(
      this.storage.saveTask(this.uid(), {
        ...task,
        completed: !task.completed,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  /** Marca como completado (si ya lo estaba, no hace nada). */
  complete(id: string): void {
    const task = this.find(id);
    if (task && !task.completed) this.toggle(id);
  }

  remove(id: string): void {
    this.persist(this.storage.deleteTask(this.uid(), id));
  }

  /** Vuelve a guardar un pendiente tal como estaba (para "Deshacer"). */
  restore(task: Task): void {
    this.persist(this.storage.saveTask(this.uid(), task));
  }

  /**
   * Importa pendientes de un respaldo (la lectura del archivo la hace BackupService).
   * Los pendientes con el mismo id se reemplazan; los demás se agregan. Nunca borra nada.
   * Devuelve cuántos se importaron.
   */
  importList(list: unknown[]): number {
    const uid = this.uid();
    const now = new Date().toISOString();
    const tasks: Task[] = [];
    for (const raw of list as Record<string, unknown>[]) {
      if (!raw || typeof raw !== 'object') continue;
      const title = raw['title'];
      if (typeof title !== 'string' || title.trim() === '') continue;
      const str = (key: string) => (typeof raw[key] === 'string' ? (raw[key] as string) : undefined);
      tasks.push({
        id: str('id') || this.storage.newTaskId(uid),
        ...normalizeInput({ title, description: str('description'), dueDate: str('dueDate') }),
        completed: raw['completed'] === true,
        createdAt: str('createdAt') ?? now,
        updatedAt: str('updatedAt') ?? now,
      });
    }

    if (tasks.length) this.persist(this.storage.saveMany(uid, tasks));
    return tasks.length;
  }

  // ---- ayudantes privados ----

  private find(id: string): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  private uid(): string {
    const user = this.auth.user();
    if (!user) throw new Error('No hay sesión iniciada.');
    return user.uid;
  }

  /** No esperamos la promesa (ver la nota en StorageService); solo mostramos el error si falla. */
  private persist(promise: Promise<void>): void {
    this.error.set(null);
    promise.catch((e: Error) => this.error.set('No se pudo guardar: ' + e.message));
  }
}

// ---- funciones puras ----

function normalizeInput(input: TaskInput): Pick<Task, 'title' | 'description' | 'dueDate'> {
  const description = input.description?.trim();
  const dueDate = input.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) ? input.dueDate : undefined;
  return { title: input.title.trim(), description: description || undefined, dueDate };
}

function matchesFilter(t: Task, filter: TaskFilter, today: string): boolean {
  switch (filter) {
    case 'all':
      return !t.completed;
    case 'no-date':
      return !t.completed && !t.dueDate;
    case 'today':
      return !t.completed && t.dueDate === today;
    case 'upcoming':
      return !t.completed && !!t.dueDate && t.dueDate > today;
    case 'overdue':
      return !t.completed && !!t.dueDate && t.dueDate < today;
    case 'completed':
      return t.completed;
  }
}

function compareTasks(a: Task, b: Task): number {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.createdAt < b.createdAt ? -1 : 1;
}
