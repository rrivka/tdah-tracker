import { Component, computed, inject } from '@angular/core';
import { AlarmService } from '../../services/alarm.service';
import { TimerService } from '../../services/timer.service';

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
}
