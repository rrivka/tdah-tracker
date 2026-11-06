import { Component, inject, output, signal } from '@angular/core';
import { TASK_FILTERS, TaskService } from '../../services/task.service';
import { Task, TaskFilter, TaskInput } from '../../models/task.model';
import { formatDateKey } from '../../utils/date.utils';
import { TaskFormComponent } from '../task-form/task-form.component';

/**
 * Lista de pendientes: filtros, la lista (marcar como completado, editar y eliminar)
 * y debajo un botón "+" que abre la ventana "Agregar" (create-dialog, en el layout).
 */
@Component({
  selector: 'app-task-list',
  imports: [TaskFormComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent {
  private readonly taskService = inject(TaskService);

  /** Botón "+": pide al layout abrir la ventana "Agregar". */
  readonly createRequested = output<void>();

  readonly filters = TASK_FILTERS;
  readonly filter = this.taskService.filter;
  readonly tasks = this.taskService.filteredTasks;
  readonly counts = this.taskService.counts;
  readonly loading = this.taskService.loading;
  readonly today = this.taskService.today;

  /** Id del pendiente que se está editando (o null). */
  readonly editingId = signal<string | null>(null);

  readonly formatDate = formatDateKey;

  setFilter(filter: TaskFilter): void {
    this.filter.set(filter);
  }

  startEdit(task: Task): void {
    this.editingId.set(task.id);
  }

  saveEdit(id: string, input: TaskInput): void {
    this.taskService.update(id, input);
    this.editingId.set(null);
  }

  toggle(id: string): void {
    this.taskService.toggle(id);
  }

  remove(task: Task): void {
    // Confirmación para evitar borrar algo por accidente.
    if (confirm(`¿Eliminar "${task.title}"?`)) {
      this.taskService.remove(task.id);
    }
  }

  isOverdue(task: Task): boolean {
    return !task.completed && !!task.dueDate && task.dueDate < this.today();
  }

  emptyMessage(): string {
    switch (this.filter()) {
      case 'completed':
        return 'Todavía no has completado ningún pendiente.';
      case 'overdue':
        return 'No tienes pendientes vencidos.';
      case 'today':
        return 'No tienes pendientes para hoy.';
      default:
        return 'No hay pendientes aquí.';
    }
  }
}
