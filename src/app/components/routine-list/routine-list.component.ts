import { Component, computed, inject, signal } from '@angular/core';
import { RoutineService } from '../../services/routine.service';
import { TaskService } from '../../services/task.service';
import { Routine, RoutineInput } from '../../models/routine.model';
import { frequencyLabel, nextDueDate, routineTimes } from '../../utils/routine.utils';
import { formatDateKey, fromDateKey, toDateKey } from '../../utils/date.utils';
import { ModalComponent } from '../modal/modal.component';
import { RoutineFormComponent } from '../routine-form/routine-form.component';
import { UndoService } from '../../services/undo.service';


/**
 * Apartado "Actividades constantes":
 * - Lista de las que tocan HOY, con casilla para marcarlas como hechas (mañana se reinician).
 * - "Ver todas": todas las actividades con su frecuencia, para editarlas o eliminarlas.
 * Las nuevas se crean con el botón "+" de la lista de pendientes.
 */
@Component({
  selector: 'app-routine-list',
  imports: [ModalComponent, RoutineFormComponent],
  templateUrl: './routine-list.component.html',
  styleUrl: './routine-list.component.scss',
})
export class RoutineListComponent {
  private readonly routineService = inject(RoutineService);
  private readonly undo = inject(UndoService);
  private readonly taskService = inject(TaskService);

  readonly today = this.routineService.today;
  readonly all = this.routineService.routines;
  readonly pendingToday = this.routineService.pendingToday;
  readonly loading = this.routineService.loading;

  /** ¿Mostrar la lista completa? */
  readonly showAll = signal(false);
  /** Actividad que se está editando (abre la ventana). */
  readonly editing = signal<Routine | null>(null);

  readonly frequencyLabel = frequencyLabel;

  readonly doneCount = computed(() => this.today().filter((r) => r.done).length);

  /** Marca/desmarca hoy (en ese horario, si tiene). */
  toggle(id: string, slot?: string): void {
    this.routineService.toggleDone(id, this.taskService.today(), slot);
  }

  /** "08:00, 21:00" o "sin horario". */
  timesLabel(routine: Routine): string {
    const times = routineTimes(routine);
    return times.length ? times.join(', ') : 'sin horario';
  }

  saveEdit(input: RoutineInput): void {
    const r = this.editing();
    if (r) this.routineService.update(r.id, input);
    this.editing.set(null);
  }

  remove(routine: Routine): void {
    // Borra al instante y ofrece "Deshacer".
    this.routineService.remove(routine.id);
    this.undo.show(`Se eliminó "${routine.title}"`, () => this.routineService.restore(routine));
  }

  /** "Hoy", "mañana" o la fecha de la próxima vez que toca. */
  nextLabel(routine: Routine): string {
    const today = this.taskService.today();
    const next = nextDueDate(routine, today);
    if (!next) return '';
    if (next === today) return 'hoy';
    const tomorrow = fromDateKey(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return next === toDateKey(tomorrow) ? 'mañana' : formatDateKey(next);
  }
}
