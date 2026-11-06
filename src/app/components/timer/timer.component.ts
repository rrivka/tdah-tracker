import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimerService } from '../../services/timer.service';
import { formatDuration } from '../../utils/time.utils';

/** Controles del temporizador: elegir tiempo, iniciar, pausar, +1 min y ventana flotante. */
@Component({
  selector: 'app-timer',
  imports: [FormsModule],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss',
})
export class TimerComponent {
  readonly timer = inject(TimerService);

  /** Atajos en minutos. Cambia esta lista para tener otros. */
  readonly presets = [1, 5, 10, 15, 25, 45];

  readonly minutes = signal(Math.floor(this.timer.duration() / 60_000));
  readonly seconds = signal(Math.floor((this.timer.duration() % 60_000) / 1000));

  readonly display = computed(() => formatDuration(this.timer.remaining()));

  startCustom(): void {
    const ms = (Number(this.minutes()) * 60 + Number(this.seconds())) * 1000;
    this.timer.start(ms);
  }

  startPreset(min: number): void {
    this.minutes.set(min);
    this.seconds.set(0);
    this.timer.start(min * 60_000);
  }

  toggleFloating(): void {
    if (this.timer.floating()) this.timer.closeFloating();
    else void this.timer.openFloating();
  }
}
