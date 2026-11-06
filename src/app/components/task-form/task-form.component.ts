import { Component, ElementRef, OnInit, effect, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TaskInput } from '../../models/task.model';

/**
 * Formulario para crear o editar un pendiente.
 * No guarda nada por sí mismo: emite `save` con los datos y el componente padre decide qué hacer.
 *
 * Uso:
 *   <app-task-form (save)="crear($event)" />                         → modo crear
 *   <app-task-form [task]="t" (save)="..." (cancelled)="..." />         → modo editar
 */
@Component({
  selector: 'app-task-form',
  imports: [FormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent implements OnInit {
  /** Si se pasa, el formulario está en modo edición. */
  readonly task = input<Task | null>(null);
  /** Fecha con la que empieza un pendiente nuevo (p. ej. el día elegido en el calendario). */
  readonly initialDate = input('');
  /** Título con el que empieza (p. ej. al clasificar una nota de la bandeja). */
  readonly initialTitle = input('');

  readonly save = output<TaskInput>();
  readonly cancelled = output<void>();

  readonly title = signal('');
  readonly description = signal('');
  readonly dueDate = signal('');

  /** Cada vez que este número aumenta, el campo de título recibe el cursor. */
  readonly focusTrigger = input(0);
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  /** Id único para conectar <label for> con su <input>. */
  readonly uid = 'task-form-' + Math.random().toString(36).slice(2, 8);

  constructor() {
    effect(() => {
      if (this.focusTrigger() > 0) {
        const el = this.titleInput()?.nativeElement;
        // setTimeout: espera a que la sección sea visible antes de enfocar.
        setTimeout(() => el?.focus());
      }
    });
  }

  ngOnInit(): void {
    if (!this.task() && this.initialDate()) this.dueDate.set(this.initialDate());
    if (!this.task() && this.initialTitle()) this.title.set(this.initialTitle());
    const t = this.task();
    if (t) {
      this.title.set(t.title);
      this.description.set(t.description ?? '');
      this.dueDate.set(t.dueDate ?? '');
    }
  }

  get isEditing(): boolean {
    return this.task() !== null;
  }

  submit(): void {
    if (!this.title().trim()) return;
    this.save.emit({
      title: this.title(),
      description: this.description() || undefined,
      dueDate: this.dueDate() || undefined,
    });
    // En modo crear, limpiamos el formulario para el siguiente pendiente.
    if (!this.isEditing) {
      this.title.set('');
      this.description.set('');
      this.dueDate.set('');
    }
  }
}
