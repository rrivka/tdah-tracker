import { Component, computed, inject, output, signal } from '@angular/core';
import { StreakService } from '../../services/streak.service';
import { TaskService } from '../../services/task.service';
import { Streak, StreakInput } from '../../models/streak.model';
import { bestStreak, currentStreak, isDone, lastDays, todayLabel } from '../../utils/streak.utils';
import { fromDateKey } from '../../utils/date.utils';
import { WEEKDAYS } from '../../utils/routine.utils';
import { ModalComponent } from '../modal/modal.component';
import { StreakCalendarComponent } from '../streak-calendar/streak-calendar.component';
import { StreakFormComponent } from '../streak-form/streak-form.component';
import { UndoService } from '../../services/undo.service';


/**
 * Apartado "Rachas" (estilo Duolingo).
 * - Una tarjeta por racha activa: emoji, 🔥 días seguidos, últimos 7 días y botón "¡Hecho hoy!".
 * - Tocar la tarjeta abre el detalle: estadísticas, calendario y acciones (pausar, editar, eliminar).
 * - Al marcar "¡Hecho hoy!" aparece una pantalla de festejo.
 * - Las rachas en pausa se listan aparte.
 */
@Component({
  selector: 'app-streak-board',
  imports: [ModalComponent, StreakCalendarComponent, StreakFormComponent],
  templateUrl: './streak-board.component.html',
  styleUrl: './streak-board.component.scss',
})
export class StreakBoardComponent {
  private readonly streakService = inject(StreakService);
  private readonly undo = inject(UndoService);
  private readonly taskService = inject(TaskService);

  /** Pide al padre abrir la ventana "Agregar" en la pestaña Racha. */
  readonly createRequested = output<void>();

  readonly today = this.taskService.today;
  readonly active = this.streakService.active;
  readonly paused = this.streakService.paused;
  readonly loading = this.streakService.loading;

  readonly showPaused = signal(false);

  /** Id de la racha abierta en detalle (se guarda el id para ver siempre los datos actuales). */
  readonly detailId = signal<string | null>(null);
  readonly detail = computed(() => {
    const id = this.detailId();
    return id ? (this.streakService.streaks().find((s) => s.id === id) ?? null) : null;
  });
  readonly editing = signal<Streak | null>(null);

  /** Festejo después de marcar "¡Hecho hoy!". */
  readonly celebration = signal<{ emoji: string; title: string; count: number } | null>(null);

  // Funciones de utilidad para el template.
  readonly currentStreak = (s: Streak) => currentStreak(s, this.today());
  readonly bestStreak = (s: Streak) => bestStreak(s, this.today());
  readonly lastDays = (s: Streak) => lastDays(s, this.today());
  readonly todayLabel = (s: Streak) => todayLabel(s, this.today());
  readonly doneToday = (s: Streak) => isDone(s, this.today());

  /** Letra del día de la semana ("L", "M"…) de una dateKey. */
  weekdayLetter(key: string): string {
    const dow = fromDateKey(key).getDay();
    return WEEKDAYS.find((d) => d.value === dow)?.short ?? '';
  }

  /** "Todos los días" o "L, X, V". */
  daysLabel(s: Streak): string {
    if (s.days.length === 7) return 'Todos los días';
    return WEEKDAYS.filter((d) => s.days.includes(d.value))
      .map((d) => d.short)
      .join(', ');
  }

  /** Botón grande de la tarjeta. Si se marca, muestra el festejo. */
  markToday(s: Streak, event: Event): void {
    event.stopPropagation(); // que no abra el detalle
    const wasDone = this.doneToday(s);
    const count = this.streakService.toggleDone(s.id);
    if (!wasDone) this.celebration.set({ emoji: s.emoji, title: s.title, count });
  }

  /** Desde el calendario: marcar/desmarcar cualquier día pasado. */
  toggleDay(s: Streak, key: string): void {
    this.streakService.toggleDone(s.id, key);
  }

  setActive(s: Streak, active: boolean): void {
    this.streakService.setActive(s.id, active);
    if (!active) this.detailId.set(null);
  }

  saveEdit(input: StreakInput): void {
    const s = this.editing();
    if (s) this.streakService.update(s.id, input);
    this.editing.set(null);
  }

  remove(s: Streak): void {
    // Borra al instante (con todo su historial) y ofrece "Deshacer".
    this.streakService.remove(s.id);
    this.detailId.set(null);
    this.undo.show(`Se eliminó la racha "${s.title}"`, () => this.streakService.restore(s));
  }

  /** Mensaje del festejo según la cantidad de días. */
  celebrationText(count: number): string {
    if (count <= 1) return '¡Primer día! Así se empieza.';
    if (count < 7) return `¡${count} días seguidos! Vas muy bien.`;
    if (count < 30) return `¡${count} días seguidos! Esto ya es un hábito.`;
    return `¡${count} días seguidos! Increíble.`;
  }
}
