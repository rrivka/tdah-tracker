import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { TickService } from './tick.service';
import { SoundService } from './sound.service';
import { NotificationService } from './notification.service';

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

const STORAGE_KEY = 'tdah-tracker:timer';

/** Ventana Picture-in-Picture de documentos (Chrome/Edge/Opera de escritorio). */
interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
}

/**
 * TimerService: estado del temporizador (cuenta regresiva).
 *
 * Vive en un servicio (y no en el componente) para que siga corriendo aunque
 * cambies de sección, y para que la ventana flotante y la sección muestren lo mismo.
 * Se guarda en localStorage, así sobrevive a una recarga de la página.
 *
 * Funciona con la hora real (`endAt`), no contando segundos: así no se atrasa
 * aunque la pestaña esté en segundo plano.
 */
@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly tick = inject(TickService);
  private readonly sound = inject(SoundService);
  private readonly notifications = inject(NotificationService);

  readonly state = signal<TimerState>('idle');
  /** Duración elegida (ms). */
  readonly duration = signal(25 * 60_000);
  private readonly endAt = signal(0);
  private readonly pausedRemaining = signal(0);

  /** Milisegundos que faltan. */
  readonly remaining = computed(() => {
    switch (this.state()) {
      case 'running':
        return Math.max(0, this.endAt() - this.tick.now());
      case 'paused':
        return this.pausedRemaining();
      case 'idle':
        return this.duration();
      case 'finished':
        return 0;
    }
  });

  /** true si hay algo que mostrar en el encabezado (corriendo, en pausa o terminado). */
  readonly active = computed(() => this.state() !== 'idle');

  // ---- Ventana flotante ----
  /** ¿Se está mostrando la ventana flotante (PiP o recuadro dentro de la app)? */
  readonly floating = signal(false);
  /** La ventana Picture-in-Picture, si el navegador la soporta y está abierta. */
  readonly pipWindow = signal<Window | null>(null);
  /** ¿El navegador soporta ventanas que quedan encima de todo? */
  readonly pipSupported = 'documentPictureInPicture' in window;

  constructor() {
    this.load();

    // Cuando llega a 0: termina y suena.
    effect(() => {
      if (this.state() === 'running' && this.remaining() === 0) untracked(() => this.finish());
    });

    // Guardar el estado en cada cambio.
    effect(() => {
      const data = {
        state: this.state(),
        duration: this.duration(),
        endAt: this.endAt(),
        pausedRemaining: this.pausedRemaining(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // sin localStorage
      }
    });
  }

  /** Inicia una cuenta regresiva de `ms` milisegundos. */
  start(ms: number = this.duration()): void {
    if (ms <= 0) return;
    this.sound.stopRinging();
    this.sound.unlock();
    void this.notifications.request();
    this.duration.set(ms);
    this.endAt.set(Date.now() + ms);
    this.state.set('running');
  }

  pause(): void {
    if (this.state() !== 'running') return;
    this.pausedRemaining.set(this.remaining());
    this.state.set('paused');
  }

  resume(): void {
    if (this.state() !== 'paused') return;
    this.endAt.set(Date.now() + this.pausedRemaining());
    this.state.set('running');
  }

  /** Suma un minuto (si ya terminó, arranca uno nuevo de 1 minuto). */
  addMinute(): void {
    switch (this.state()) {
      case 'running':
        this.endAt.update((t) => t + 60_000);
        break;
      case 'paused':
        this.pausedRemaining.update((t) => t + 60_000);
        break;
      default:
        this.start(60_000);
    }
  }

  /** Detiene todo y vuelve al inicio (también apaga el sonido). */
  reset(): void {
    this.sound.stopRinging();
    this.state.set('idle');
  }

  // ---- Ventana flotante ----

  /**
   * Abre la ventana flotante. En Chrome/Edge/Opera de escritorio es una ventana
   * Picture-in-Picture que queda encima de todos los programas. En los demás
   * navegadores es un recuadro fijo dentro de la app.
   */
  async openFloating(): Promise<void> {
    const dpip = (window as unknown as { documentPictureInPicture?: DocumentPictureInPicture })
      .documentPictureInPicture;
    if (dpip && !this.pipWindow()) {
      try {
        const pip = await dpip.requestWindow({ width: 300, height: 220 });
        pip.addEventListener('pagehide', () => {
          this.pipWindow.set(null);
          this.floating.set(false);
        });
        this.pipWindow.set(pip);
      } catch {
        // Si falla, usamos el recuadro dentro de la app.
      }
    }
    this.floating.set(true);
  }

  closeFloating(): void {
    const pip = this.pipWindow();
    if (pip) pip.close(); // dispara 'pagehide', que limpia el estado
    else this.floating.set(false);
  }

  // ---- privados ----

  private finish(): void {
    this.state.set('finished');
    this.sound.startRinging();
    void this.notifications.show('⏱ Se acabó el tiempo', 'Tu temporizador llegó a 0.');
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.duration === 'number') this.duration.set(data.duration);
      if (data.state === 'paused') {
        this.pausedRemaining.set(data.pausedRemaining);
        this.state.set('paused');
      } else if (data.state === 'running' && data.endAt > Date.now()) {
        this.endAt.set(data.endAt);
        this.state.set('running');
      }
      // Si terminó mientras la app estaba cerrada, volvemos a "idle" sin sonar.
    } catch {
      // datos dañados: empezamos de cero
    }
  }
}
