import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * SoundService: pitidos generados con Web Audio (no necesita archivos de audio).
 *
 * Los navegadores no dejan reproducir sonido hasta que el usuario toca la página
 * al menos una vez. Por eso "desbloqueamos" el audio en el primer toque/clic.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  private ctx: AudioContext | null = null;
  private ringInterval: ReturnType<typeof setInterval> | null = null;
  private ringTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DOCUMENT).addEventListener('pointerdown', () => this.unlock(), { passive: true });
  }

  /** Prepara el audio (debe llamarse durante un clic/toque del usuario). */
  unlock(): void {
    try {
      this.ctx ??= new AudioContext();
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      // Sin Web Audio: no habrá sonido, pero sí aviso visual y notificación.
    }
  }

  /** Empieza a sonar (dos pitidos cada segundo) hasta llamar a stopRinging(), máximo 1 minuto. */
  startRinging(): void {
    this.stopRinging();
    const pattern = () => {
      this.beep(0);
      this.beep(0.25);
      navigator.vibrate?.([200, 100, 200]);
    };
    pattern();
    this.ringInterval = setInterval(pattern, 1200);
    this.ringTimeout = setTimeout(() => this.stopRinging(), 60_000);
  }

  stopRinging(): void {
    if (this.ringInterval) clearInterval(this.ringInterval);
    if (this.ringTimeout) clearTimeout(this.ringTimeout);
    this.ringInterval = this.ringTimeout = null;
    navigator.vibrate?.(0);
  }

  /** Un pitido corto, `delay` segundos en el futuro. */
  private beep(delay: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880; // tono (Hz)
    gain.gain.setValueAtTime(0.3, t); // volumen
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}
