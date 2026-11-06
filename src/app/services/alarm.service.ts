import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Alarm } from '../models/alarm.model';
import { TickService } from './tick.service';
import { SoundService } from './sound.service';
import { NotificationService } from './notification.service';
import { toDateKey } from '../utils/date.utils';
import { toTimeKey } from '../utils/time.utils';

const STORAGE_KEY = 'tdah-tracker:alarms';
const SNOOZE_MS = 5 * 60_000;

/**
 * AlarmService: guarda las alarmas y las hace sonar a su hora.
 *
 * IMPORTANTE: una página web solo puede sonar mientras está abierta (puede estar
 * minimizada o en otra pestaña). Si cierras la app, la alarma no suena.
 */
@Injectable({ providedIn: 'root' })
export class AlarmService {
  private readonly tick = inject(TickService);
  private readonly sound = inject(SoundService);
  private readonly notifications = inject(NotificationService);

  private readonly _alarms = signal<Alarm[]>(load());
  /** Alarmas ordenadas por hora. */
  readonly alarms = computed(() => [..._sorted(this._alarms())]);

  /** Alarma que está sonando ahora (o null). */
  readonly ringing = signal<Alarm | null>(null);

  /** Alarma pospuesta y cuándo vuelve a sonar. */
  private snoozed: { alarm: Alarm; at: number } | null = null;
  /** Para no sonar dos veces en el mismo minuto: id → "YYYY-MM-DD HH:MM". */
  private readonly lastFired = new Map<string, string>();

  constructor() {
    // Revisar en cada latido si toca sonar.
    effect(() => {
      const now = this.tick.now();
      untracked(() => this.check(now));
    });

    // Guardar en cada cambio.
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._alarms()));
      } catch {
        // sin localStorage
      }
    });
  }

  add(time: string, label: string, repeat: boolean): void {
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    this.sound.unlock();
    void this.notifications.request();
    const alarm: Alarm = { id: crypto.randomUUID(), time, label: label.trim(), enabled: true, repeat };
    this._alarms.update((list) => [...list, alarm]);
    // Si se crea para el minuto actual, que no suene de inmediato.
    this.lastFired.set(alarm.id, `${toDateKey(new Date())} ${toTimeKey(new Date())}`);
  }

  toggle(id: string): void {
    this.sound.unlock();
    this._alarms.update((list) => list.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }

  remove(id: string): void {
    this._alarms.update((list) => list.filter((a) => a.id !== id));
    if (this.snoozed?.alarm.id === id) this.snoozed = null;
  }

  /** Apaga la alarma que está sonando. */
  stop(): void {
    this.ringing.set(null);
    this.sound.stopRinging();
  }

  /** Pospone 5 minutos la alarma que está sonando. */
  snooze(): void {
    const alarm = this.ringing();
    if (alarm) this.snoozed = { alarm, at: Date.now() + SNOOZE_MS };
    this.stop();
  }

  /** Milisegundos hasta la próxima vez que sonará (para mostrar "en 2 h"). */
  msUntil(alarm: Alarm, now: number): number {
    const [h, m] = alarm.time.split(':').map(Number);
    const next = new Date(now);
    next.setHours(h, m, 0, 0);
    if (next.getTime() <= now) next.setDate(next.getDate() + 1);
    return next.getTime() - now;
  }

  // ---- privados ----

  private check(now: number): void {
    const date = new Date(now);
    const minute = toTimeKey(date);
    const key = `${toDateKey(date)} ${minute}`;

    for (const alarm of this._alarms()) {
      if (!alarm.enabled || alarm.time !== minute || this.lastFired.get(alarm.id) === key) continue;
      this.lastFired.set(alarm.id, key);
      this.fire(alarm);
      // Las de una sola vez se apagan solas.
      if (!alarm.repeat) {
        this._alarms.update((list) => list.map((a) => (a.id === alarm.id ? { ...a, enabled: false } : a)));
      }
    }

    if (this.snoozed && now >= this.snoozed.at) {
      const { alarm } = this.snoozed;
      this.snoozed = null;
      this.fire(alarm);
    }
  }

  /** Hace sonar un aviso ahora mismo (lo usan los recordatorios de actividades constantes). */
  ring(alarm: Alarm): void {
    this.fire(alarm);
  }

  private fire(alarm: Alarm): void {
    this.ringing.set(alarm);
    this.sound.startRinging();
    void this.notifications.show(`⏰ ${alarm.time}`, alarm.label || 'Alarma');
  }
}

function load(): Alarm[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function _sorted(list: Alarm[]): Alarm[] {
  return [...list].sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
}
