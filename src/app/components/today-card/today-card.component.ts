import { Component, computed, inject, output } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { RoutineForDay, RoutineService } from '../../services/routine.service';
import { StreakService } from '../../services/streak.service';
import { UndoService } from '../../services/undo.service';
import { Task } from '../../models/task.model';
import { Streak } from '../../models/streak.model';
import { isDone, isScheduled } from '../../utils/streak.utils';
import { formatDateKey } from '../../utils/date.utils';

/**
 * Tarjeta "Hoy": todo lo que te toca hoy y aún no está hecho, en un solo lugar.
 *  - 💊 Actividades constantes de hoy (una fila por horario).
 *  - ✅ Pendientes con fecha de hoy y los vencidos (con botón "→ Hoy").
 *  - 🔥 Rachas que tocan hoy.
 * Al marcar algo desaparece de la lista, con opción de "Deshacer".
 */
@Component({
  selector: 'app-today-card',
  templateUrl: './today-card.component.html',
  styleUrl: './today-card.component.scss',
})
export class TodayCardComponent {
  private readonly taskService = inject(TaskService);
  private readonly routineService = inject(RoutineService);
  private readonly streakService = inject(StreakService);
  private readonly undo = inject(UndoService);

  /** Botón "+": pide al layout abrir la ventana "Agregar". */
  readonly createRequested = output<void>();

  readonly today = this.taskService.today;
  readonly loading = computed(() => this.taskService.loading() || this.routineService.loading());

  /** "jueves 5 de noviembre". */
  readonly dateLabel = computed(() =>
    new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
  );

  // ---- Lo que falta ----

  readonly routines = computed(() => this.routineService.today().filter((r) => !r.done));

  /** Pendientes de hoy y vencidos (los vencidos primero, del más viejo al más nuevo). */
  readonly tasks = computed(() =>
    this.taskService
      .tasks()
      .filter((t) => !t.completed && !!t.dueDate && t.dueDate <= this.today())
      .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0)),
  );

  readonly streaks = computed(() =>
    this.streakService.active().filter((s) => isScheduled(s, this.today()) && !isDone(s, this.today())),
  );

  // ---- Progreso del día ----

  readonly pending = computed(() => this.routines().length + this.tasks().length + this.streaks().length);

  readonly done = computed(() => {
    const today = this.today();
    const routinesDone = this.routineService.today().filter((r) => r.done).length;
    const tasksDone = this.taskService.tasks().filter((t) => t.completed && t.dueDate === today).length;
    const streaksDone = this.streakService.active().filter((s) => isDone(s, today)).length;
    return routinesDone + tasksDone + streaksDone;
  });

  readonly progress = computed(() => {
    const total = this.pending() + this.done();
    return total === 0 ? 0 : Math.round((this.done() / total) * 100);
  });

  // ---- Acciones (todas con "Deshacer") ----

  completeRoutine(item: RoutineForDay): void {
    const { routine, slot } = item;
    this.routineService.setDone(routine.id, this.today(), true, slot);
    this.undo.show(`✓ ${routine.title}${slot ? ' (' + slot + ')' : ''}`, () =>
      this.routineService.setDone(routine.id, this.today(), false, slot),
    );
  }

  completeTask(task: Task): void {
    this.taskService.toggle(task.id);
    this.undo.show(`✓ ${task.title}`, () => this.taskService.toggle(task.id));
  }

  completeStreak(streak: Streak): void {
    const count = this.streakService.toggleDone(streak.id);
    this.undo.show(`🔥 ${count} · ${streak.title}`, () => this.streakService.toggleDone(streak.id));
  }

  /** Cambia la fecha de un pendiente vencido a hoy. */
  moveToToday(task: Task): void {
    const previous = task.dueDate;
    this.taskService.update(task.id, { title: task.title, description: task.description, dueDate: this.today() });
    this.undo.show(`"${task.title}" pasó a hoy`, () =>
      this.taskService.update(task.id, { title: task.title, description: task.description, dueDate: previous }),
    );
  }

  isOverdue(task: Task): boolean {
    return !!task.dueDate && task.dueDate < this.today();
  }

  formatDate(key: string): string {
    return formatDateKey(key);
  }

  routineKey(item: RoutineForDay): string {
    return item.routine.id + (item.slot ?? '');
  }
}
