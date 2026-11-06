import { Component, computed, input, output, signal } from '@angular/core';
import { Streak, StreakDayStatus } from '../../models/streak.model';
import { dayStatus } from '../../utils/streak.utils';
import { formatDateKey, fromDateKey, toDateKey } from '../../utils/date.utils';

interface Cell {
  key: string;
  day: number;
  inMonth: boolean;
  status: StreakDayStatus;
  /** ¿Se puede tocar para marcar/desmarcar? (hoy y días pasados desde que empezó) */
  editable: boolean;
}

/** Texto de cada estado (lectores de pantalla y leyenda). */
const STATUS_LABELS: Record<StreakDayStatus, string> = {
  done: 'cumplido',
  missed: 'no cumplido',
  today: 'hoy toca',
  rest: 'descanso',
  paused: 'en pausa',
  future: 'próximo',
  before: 'antes de empezar',
};

/**
 * Calendario mensual de una racha: muestra cada día como cumplido, fallado, descanso o pausa.
 * Tocar un día pasado (o hoy) emite `toggleDay` para marcarlo/desmarcarlo
 * (útil si olvidaste registrarlo).
 */
@Component({
  selector: 'app-streak-calendar',
  templateUrl: './streak-calendar.component.html',
  styleUrl: './streak-calendar.component.scss',
})
export class StreakCalendarComponent {
  readonly streak = input.required<Streak>();
  readonly today = input.required<string>();
  readonly toggleDay = output<string>();

  readonly weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  readonly legend: StreakDayStatus[] = ['done', 'missed', 'rest', 'paused'];
  readonly labels = STATUS_LABELS;

  /** Primer día del mes que se ve ("YYYY-MM-01"). Empieza en el mes actual. */
  private readonly month = signal(toDateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));

  readonly monthLabel = computed(() => {
    const text = fromDateKey(this.month()).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    return text.charAt(0).toUpperCase() + text.slice(1);
  });

  readonly cells = computed<Cell[]>(() => {
    const s = this.streak();
    const today = this.today();
    const first = fromDateKey(this.month());
    const year = first.getFullYear();
    const month = first.getMonth();
    const offset = (first.getDay() + 6) % 7; // lunes = 0
    const total = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7) * 7;
    const cells: Cell[] = [];
    for (let i = 0; i < total; i++) {
      const date = new Date(year, month, 1 - offset + i);
      const key = toDateKey(date);
      cells.push({
        key,
        day: date.getDate(),
        inMonth: date.getMonth() === month,
        status: dayStatus(s, key, today),
        editable: key <= today && key >= s.startDate,
      });
    }
    return cells;
  });

  move(delta: number): void {
    const d = fromDateKey(this.month());
    this.month.set(toDateKey(new Date(d.getFullYear(), d.getMonth() + delta, 1)));
  }

  cellLabel(cell: Cell): string {
    return `${formatDateKey(cell.key)}: ${STATUS_LABELS[cell.status]}`;
  }
}
