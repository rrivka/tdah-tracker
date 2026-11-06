import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Streak, StreakInput } from '../models/streak.model';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { TaskService } from './task.service';
import { currentStreak } from '../utils/streak.utils';
import { fromDateKey, toDateKey } from '../utils/date.utils';

/**
 * StreakService: rachas estilo Duolingo (hábitos que quieres sostener día a día).
 * Igual que los otros servicios de datos: usa StorageService y nunca habla con Firebase directamente.
 */
@Injectable({ providedIn: 'root' })
export class StreakService {
  private readonly auth = inject(AuthService);
  private readonly storage = inject(StorageService);
  /** Reutilizamos su `today` y su signal de error. */
  private readonly tasks = inject(TaskService);

  private readonly _streaks = signal<Streak[]>([]);
  readonly loading = signal(true);

  /** Todas, por fecha de creación. */
  readonly streaks = computed(() => [...this._streaks()].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)));
  /** Las activas (se muestran como tarjetas). */
  readonly active = computed(() => this.streaks().filter((s) => s.active));
  /** Las que están en pausa. */
  readonly paused = computed(() => this.streaks().filter((s) => !s.active));

  constructor() {
    effect((onCleanup) => {
      const user = this.auth.user();
      this._streaks.set([]);
      if (!user) return;
      this.loading.set(true);
      const unsubscribe = this.storage.watchStreaks(
        user.uid,
        (streaks) => {
          this._streaks.set(streaks.map(withDefaults));
          this.loading.set(false);
        },
        (e) => {
          this.tasks.error.set('No se pudieron cargar las rachas: ' + e.message);
          this.loading.set(false);
        },
      );
      onCleanup(unsubscribe);
    });
  }

  find(id: string): Streak | undefined {
    return this._streaks().find((s) => s.id === id);
  }

  add(input: StreakInput): void {
    const uid = this.uid();
    const now = new Date().toISOString();
    this.save({
      id: this.storage.newStreakId(uid),
      ...normalize(input),
      active: true,
      pauses: [],
      doneDates: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id: string, input: StreakInput): void {
    const s = this.find(id);
    if (s) this.save({ ...s, ...normalize(input) });
  }

  remove(id: string): void {
    this.persist(this.storage.deleteStreak(this.uid(), id));
  }

  /**
   * Marca o desmarca un día como cumplido (por defecto hoy).
   * Devuelve la racha actual resultante (para el festejo).
   */
  toggleDone(id: string, dateKey: string = this.tasks.today()): number {
    const s = this.find(id);
    if (!s) return 0;
    const done = s.doneDates.includes(dateKey);
    const doneDates = done ? s.doneDates.filter((d) => d !== dateKey) : [...s.doneDates, dateKey].sort();
    const updated = { ...s, doneDates };
    this.save(updated);
    return currentStreak(updated, this.tasks.today());
  }

  /**
   * Pausar / reanudar.
   * Al pausar se abre un periodo de pausa desde hoy; al reanudar se cierra ayer.
   * Los días en pausa no cuentan como fallados, así que la racha no se rompe.
   */
  setActive(id: string, active: boolean): void {
    const s = this.find(id);
    if (!s || s.active === active) return;
    const today = this.tasks.today();
    let pauses = [...s.pauses];
    if (!active) {
      pauses.push({ from: today });
    } else {
      const yesterday = fromDateKey(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const to = toDateKey(yesterday);
      pauses = pauses
        .map((p) => (p.to ? p : { ...p, to }))
        // Pausada y reanudada el mismo día: esa pausa no sirve, se quita.
        .filter((p) => !p.to || p.to >= p.from);
    }
    this.save({ ...s, active, pauses });
  }

  exportList(): Streak[] {
    return this.streaks();
  }

  importList(list: unknown[]): number {
    const uid = this.uid();
    const now = new Date().toISOString();
    const streaks: Streak[] = [];
    for (const raw of list as Record<string, unknown>[]) {
      if (!raw || typeof raw !== 'object' || typeof raw['title'] !== 'string' || !raw['title'].trim()) continue;
      streaks.push(
        withDefaults({
          ...(raw as unknown as Streak),
          id: typeof raw['id'] === 'string' && raw['id'] ? raw['id'] : this.storage.newStreakId(uid),
          createdAt: typeof raw['createdAt'] === 'string' ? raw['createdAt'] : now,
          updatedAt: now,
        }),
      );
    }
    if (streaks.length) this.persist(this.storage.saveManyStreaks(uid, streaks));
    return streaks.length;
  }

  // ---- privados ----

  private save(s: Streak): void {
    this.persist(this.storage.saveStreak(this.uid(), { ...s, updatedAt: new Date().toISOString() }));
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

function normalize(input: StreakInput): StreakInput {
  const days = [...new Set(input.days)].filter((d) => d >= 0 && d <= 6).sort();
  return {
    title: input.title.trim(),
    emoji: input.emoji.trim() || '⭐',
    description: input.description?.trim() || undefined,
    days: days.length ? days : [0, 1, 2, 3, 4, 5, 6],
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(input.startDate) ? input.startDate : toDateKey(new Date()),
  };
}

/** Rellena campos que podrían faltar (datos importados o viejos). */
function withDefaults(s: Streak): Streak {
  return {
    ...s,
    emoji: s.emoji || '⭐',
    days: Array.isArray(s.days) && s.days.length ? s.days : [0, 1, 2, 3, 4, 5, 6],
    active: s.active !== false,
    pauses: Array.isArray(s.pauses) ? s.pauses : [],
    doneDates: Array.isArray(s.doneDates) ? s.doneDates : [],
    startDate: s.startDate || toDateKey(new Date()),
  };
}
