import { Component, ElementRef, OnInit, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Streak, StreakInput } from '../../models/streak.model';
import { WEEKDAYS } from '../../utils/routine.utils';
import { STREAK_EMOJIS } from '../../utils/streak.utils';
import { todayKey } from '../../utils/date.utils';

/** Formulario para crear o editar una racha. Solo emite `save`; no guarda nada por sí mismo. */
@Component({
  selector: 'app-streak-form',
  imports: [FormsModule],
  templateUrl: './streak-form.component.html',
  styleUrl: './streak-form.component.scss',
})
export class StreakFormComponent implements OnInit {
  readonly streak = input<Streak | null>(null);
  readonly focusTrigger = input(0);
  /** Título con el que empieza (p. ej. al clasificar una nota de la bandeja). */
  readonly initialTitle = input('');

  readonly save = output<StreakInput>();
  readonly cancelled = output<void>();

  readonly weekdays = WEEKDAYS;
  readonly emojis = STREAK_EMOJIS;

  readonly title = signal('');
  readonly emoji = signal(STREAK_EMOJIS[0]);
  readonly description = signal('');
  readonly days = signal<number[]>([0, 1, 2, 3, 4, 5, 6]);
  readonly startDate = signal(todayKey());

  readonly valid = computed(() => !!this.title().trim() && this.days().length > 0);
  readonly everyDay = computed(() => this.days().length === 7);

  readonly uid = 'streak-form-' + Math.random().toString(36).slice(2, 8);
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
    if (!this.streak() && this.initialTitle()) this.title.set(this.initialTitle());
    const s = this.streak();
    if (!s) return;
    this.title.set(s.title);
    this.emoji.set(s.emoji);
    this.description.set(s.description ?? '');
    this.days.set([...s.days]);
    this.startDate.set(s.startDate);
  }

  get isEditing(): boolean {
    return this.streak() !== null;
  }

  toggleDay(day: number): void {
    this.days.update((list) => (list.includes(day) ? list.filter((d) => d !== day) : [...list, day]));
  }

  setEveryDay(): void {
    this.days.set([0, 1, 2, 3, 4, 5, 6]);
  }

  submit(): void {
    if (!this.valid()) return;
    this.save.emit({
      title: this.title(),
      emoji: this.emoji(),
      description: this.description() || undefined,
      days: this.days(),
      startDate: this.startDate(),
    });
  }
}
