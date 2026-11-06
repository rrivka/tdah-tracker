import { Component, computed, inject } from '@angular/core';
import { AlarmService } from '../../services/alarm.service';
import { TimerService } from '../../services/timer.service';
import { RoutineService } from '../../services/routine.service';
import { TaskService } from '../../services/task.service';
import { UndoService } from '../../services/undo.service';
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

  private readonly tasks = inject(TaskService);
  private readonly undo = inject(UndoService);

  /** "Ya lo hice": marca ese horario de la actividad como hecho hoy y apaga el aviso. */
  markDone(routineId: string, slot: string): void {
    this.routines.setDone(routineId, toDateKey(new Date()), true, slot);
    this.alarmService.stop();
  }

  /** Enfoque terminado y pendiente completado (con "Deshacer" por si acaso). */
  focusDone(taskId: string, title: string): void {
    this.tasks.complete(taskId);
    this.timer.endFocus();
    this.undo.show(`✓ ${title}`, () => this.tasks.toggle(taskId));
  }

  /** Enfoque terminado, pero el pendiente sigue abierto. */
  focusNotYet(): void {
    this.timer.endFocus();
  }
}
