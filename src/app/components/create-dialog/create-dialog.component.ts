import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { RoutineService } from '../../services/routine.service';
import { StreakService } from '../../services/streak.service';
import { TaskInput } from '../../models/task.model';
import { RoutineInput } from '../../models/routine.model';
import { StreakInput } from '../../models/streak.model';
import { ModalComponent } from '../modal/modal.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { RoutineFormComponent } from '../routine-form/routine-form.component';
import { StreakFormComponent } from '../streak-form/streak-form.component';

/** Los tres tipos que se pueden crear. */
export type CreateType = 'task' | 'routine' | 'streak';

/** Pestañas de la ventana "Agregar", con una línea que explica cada tipo. */
export const CREATE_TYPES: { id: CreateType; label: string; help: string }[] = [
  { id: 'task', label: 'Pendiente', help: 'Algo corto que haces una vez. Ej. llamar al dentista.' },
  { id: 'routine', label: 'Constante', help: 'Algo corto que se repite. Ej. tomar medicamento.' },
  { id: 'streak', label: 'Racha', help: 'Un hábito que quieres sostener día a día. Ej. hacer ejercicio.' },
];

/** Pedido para abrir la ventana. `n` cambia en cada pedido para que se note aunque el tipo sea el mismo. */
export interface CreateRequest {
  type: CreateType;
  n: number;
  /** Fecha para el nuevo pendiente ("YYYY-MM-DD"), p. ej. al agregar desde el calendario. */
  date?: string;
}

/**
 * Ventana "Agregar" (botón +): crea un pendiente, una actividad constante o una racha.
 * Vive en el layout (fuera de las secciones) para poder abrirse desde cualquier pantalla.
 */
@Component({
  selector: 'app-create-dialog',
  imports: [ModalComponent, TaskFormComponent, RoutineFormComponent, StreakFormComponent],
  templateUrl: './create-dialog.component.html',
  styleUrl: './create-dialog.component.scss',
})
export class CreateDialogComponent {
  private readonly tasks = inject(TaskService);
  private readonly routines = inject(RoutineService);
  private readonly streaks = inject(StreakService);

  readonly request = input<CreateRequest | null>(null);

  readonly types = CREATE_TYPES;
  readonly open = signal(false);
  readonly type = signal<CreateType>('task');
  readonly help = computed(() => CREATE_TYPES.find((t) => t.id === this.type())?.help ?? '');
  /** Fecha sugerida para el pendiente (viene del pedido). */
  readonly date = computed(() => this.request()?.date ?? '');

  constructor() {
    effect(() => {
      const req = this.request();
      if (!req) return;
      untracked(() => {
        this.type.set(req.type);
        this.open.set(true);
      });
    });
  }

  addTask(input: TaskInput): void {
    this.tasks.add(input);
    this.open.set(false);
  }

  addRoutine(input: RoutineInput): void {
    this.routines.add(input);
    this.open.set(false);
  }

  addStreak(input: StreakInput): void {
    this.streaks.add(input);
    this.open.set(false);
  }
}
