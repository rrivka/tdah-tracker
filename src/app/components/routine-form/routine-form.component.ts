import { Component, ElementRef, OnInit, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Routine, RoutineFrequency, RoutineInput } from '../../models/routine.model';
import { WEEKDAYS } from '../../utils/routine.utils';
import { todayKey } from '../../utils/date.utils';

/**
 * Formulario para crear o editar una actividad constante.
 * Igual que task-form: no guarda nada, solo emite `save` con los datos.
 */
@Component({
  selector: 'app-routine-form',
  imports: [FormsModule],
  templateUrl: './routine-form.component.html',
  styleUrl: './routine-form.component.scss',
})
export class RoutineFormComponent implements OnInit {
  /** Si se pasa, el formulario está en modo edición. */
  readonly routine = input<Routine | null>(null);
  /** Cuando es > 0, el título recibe el cursor al abrir. */
  readonly focusTrigger = input(0);

  readonly save = output<RoutineInput>();
  readonly cancelled = output<void>();

  readonly weekdays = WEEKDAYS;
  readonly frequencies: { id: RoutineFrequency; label: string }[] = [
    { id: 'daily', label: 'Todos los días' },
    { id: 'weekdays', label: 'Algunos días de la semana' },
    { id: 'interval', label: 'Cada cierto número de días' },
  ];

  readonly title = signal('');
  readonly description = signal('');
  readonly frequency = signal<RoutineFrequency>('daily');
  readonly days = signal<number[]>([1, 2, 3, 4, 5]); // por defecto de lunes a viernes
  readonly everyDays = signal(2);
  readonly startDate = signal(todayKey());
  readonly time = signal('');
  readonly remind = signal(false);

  /** ¿Se puede guardar? (título y, si es por días de la semana, al menos un día). */
  readonly valid = computed(
    () => !!this.title().trim() && (this.frequency() !== 'weekdays' || this.days().length > 0),
  );

  readonly uid = 'routine-form-' + Math.random().toString(36).slice(2, 8);
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  constructor() {
    effect(() => {
      if (this.focusTrigger() > 0) {
        const el = this.titleInput()?.nativeElement;
        setTimeout(() => el?.focus());
      }
    });
  }

  ngOnInit(): void {
    const r = this.routine();
    if (!r) return;
    this.title.set(r.title);
    this.description.set(r.description ?? '');
    this.frequency.set(r.frequency);
    if (r.days) this.days.set(r.days);
    if (r.everyDays) this.everyDays.set(r.everyDays);
    this.startDate.set(r.startDate);
    this.time.set(r.time ?? '');
    this.remind.set(r.remind);
  }

  get isEditing(): boolean {
    return this.routine() !== null;
  }

  toggleDay(day: number): void {
    this.days.update((list) => (list.includes(day) ? list.filter((d) => d !== day) : [...list, day]));
  }

  submit(): void {
    if (!this.valid()) return;
    this.save.emit({
      title: this.title(),
      description: this.description() || undefined,
      frequency: this.frequency(),
      days: this.days(),
      everyDays: Number(this.everyDays()),
      startDate: this.startDate(),
      time: this.time() || undefined,
      remind: this.remind(),
    });
  }
}
