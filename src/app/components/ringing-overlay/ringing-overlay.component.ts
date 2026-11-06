import { Component, computed, inject } from '@angular/core';
import { AlarmService } from '../../services/alarm.service';
import { TimerService } from '../../services/timer.service';
import { RoutineService } from '../../services/routine.service';
import { toDateKey } from '../../utils/date.utils';

/**
 * Aviso a pantalla completa cuando suena una alarma o termina el temporizador.
 * Aparece sobre cualquier sección (también en el teléfono).
 */
@Component({
  selector: 'app-ringing-overlay',
  templateUrl: './ringing-overlay.component.html',
  styleUrl: './ringing-overlay.component.scss',
})
export class RingingOverlayComponent {
  readonly alarmService = inject(AlarmService);
  readonly timer = inject(TimerService);

  readonly alarm = this.alarmService.ringing;
  readonly timerFinished = computed(() => this.timer.state() === 'finished');

  private readonly routines = inject(RoutineService);

  /** "Ya lo hice": marca la actividad como hecha hoy y apaga el aviso. */
  markDone(routineId: string): void {
    this.routines.setDone(routineId, toDateKey(new Date()), true);
    this.alarmService.stop();
  }
}
