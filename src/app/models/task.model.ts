/**
 * Un pendiente.
 *
 * Las fechas se guardan como texto para que sean fáciles de exportar a JSON:
 * - `dueDate` es un día "YYYY-MM-DD" (sin hora, así no hay problemas de zona horaria).
 * - `createdAt` / `updatedAt` son fechas ISO completas ("2026-11-05T19:30:00.000Z").
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Datos que el usuario llena en el formulario (lo demás lo calcula la app). */
export interface TaskInput {
  title: string;
  description?: string;
  dueDate?: string;
}

/** Filtros disponibles en la lista de pendientes. */
export type TaskFilter = 'all' | 'no-date' | 'today' | 'upcoming' | 'overdue' | 'completed';
