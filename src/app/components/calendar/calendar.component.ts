import { Component, computed, inject, signal } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { RoutineService } from '../../services/routine.service';
import { formatDateKey, toDateKey, todayKey } from '../../utils/date.utils';

/** Una casilla del calendario. */
interface CalendarCell {
  key: string; // "YYYY-MM-DD"
  day: number;
  inMonth: boolean; // false = día del mes anterior/siguiente (relleno)
  isToday: boolean;
  pending: number; // pendientes sin completar ese día
  completed: number;
}

/**
 * Calendario mensual.
 * - Flechas para cambiar de mes y botón "Hoy".
 * - Marca el día de hoy y los días que tienen pendientes.
 * - Al tocar un día, muestra abajo las actividades constantes y los pendientes de ese día.
 */
@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent {
  private readonly taskService = inject(TaskService);
  private readonly routineService = inject(RoutineService);

  /** Mes que se está viendo. */
  readonly viewYear = signal(new Date().getFullYear());
  readonly viewMonth = signal(new Date().getMonth()); // 0 = enero

  /** Día seleccionado ("YYYY-MM-DD"). */
  readonly selected = signal(todayKey());

  /** Encabezados de la semana (empieza en lunes). */
  readonly weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  /** "Noviembre de 2026" (solo la primera letra en mayúscula). */
  readonly monthLabel = computed(() => {
    const text = new Date(this.viewYear(), this.viewMonth(), 1).toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric',
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
  });

  /** Todas las casillas del mes (semanas completas, de lunes a domingo). */
  readonly cells = computed<CalendarCell[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const today = this.taskService.today();
    const summary = this.taskService.summaryByDate();

    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // días antes del 1 (lunes = 0)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;

    const cells: CalendarCell[] = [];
    for (let i = 0; i < total; i++) {
      const date = new Date(year, month, 1 - offset + i);
      const key = toDateKey(date);
      const s = summary.get(key);
      cells.push({
        key,
        day: date.getDate(),
        inMonth: date.getMonth() === month,
        isToday: key === today,
        pending: s?.pending ?? 0,
        completed: s?.completed ?? 0,
      });
    }
    return cells;
  });

  readonly selectedLabel = computed(() => formatDateKey(this.selected()));
  readonly selectedTasks = computed(() => {
    // Leer tasks() hace que esto se recalcule cuando cambian los pendientes.
    this.taskService.tasks();
    return this.taskService.tasksForDate(this.selected());
  });

  previousMonth(): void {
    this.moveMonth(-1);
  }

  nextMonth(): void {
    this.moveMonth(1);
  }

  goToToday(): void {
    const now = new Date();
    this.viewYear.set(now.getFullYear());
    this.viewMonth.set(now.getMonth());
    this.selected.set(todayKey());
  }

  select(cell: CalendarCell): void {
    this.selected.set(cell.key);
    // Si tocas un día de otro mes, el calendario se mueve a ese mes.
    if (!cell.inMonth) {
      const [y, m] = cell.key.split('-').map(Number);
      this.viewYear.set(y);
      this.viewMonth.set(m - 1);
    }
  }

  toggle(id: string): void {
    this.taskService.toggle(id);
  }

  /** Actividades constantes que tocan el día seleccionado. */
  readonly selectedRoutines = computed(() => {
    this.routineService.routines(); // se recalcula cuando cambian
    return this.routineService.forDate(this.selected());
  });

  /** Marca/desmarca una actividad como hecha en el día seleccionado. */
  toggleRoutine(id: string, slot?: string): void {
    this.routineService.toggleDone(id, this.selected(), slot);
  }

  /** Texto para lectores de pantalla, p. ej. "5 de noviembre, 2 pendientes". */
  cellLabel(cell: CalendarCell): string {
    const base = formatDateKey(cell.key);
    return cell.pending ? `${base}, ${cell.pending} pendiente(s)` : base;
  }

  private moveMonth(delta: number): void {
    const d = new Date(this.viewYear(), this.viewMonth() + delta, 1);
    this.viewYear.set(d.getFullYear());
    this.viewMonth.set(d.getMonth());
  }
}
