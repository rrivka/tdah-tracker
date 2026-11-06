import { Injectable, inject } from '@angular/core';
import { TaskService } from './task.service';
import { RoutineService } from './routine.service';

/**
 * BackupService: exportar e importar el respaldo JSON (pendientes + actividades constantes).
 *
 * Formato del archivo:
 *   { app, version, exportedAt, tasks: [...], routines: [...] }
 * También acepta respaldos viejos que solo tenían `tasks`, o una lista suelta de pendientes.
 */
@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly tasks = inject(TaskService);
  private readonly routines = inject(RoutineService);

  exportJson(): string {
    return JSON.stringify(
      {
        app: 'tdah-tracker',
        version: 2,
        exportedAt: new Date().toISOString(),
        tasks: this.tasks.tasks(),
        routines: this.routines.exportList(),
      },
      null,
      2,
    );
  }

  /** Importa un respaldo. Devuelve cuántos de cada tipo. Lanza Error con mensaje claro si no sirve. */
  importJson(text: string): { tasks: number; routines: number } {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('El archivo no es un JSON válido.');
    }
    const obj = (Array.isArray(data) ? { tasks: data } : data) as { tasks?: unknown; routines?: unknown } | null;
    const taskList = Array.isArray(obj?.tasks) ? obj.tasks : [];
    const routineList = Array.isArray(obj?.routines) ? obj.routines : [];

    const result = {
      tasks: this.tasks.importList(taskList),
      routines: this.routines.importList(routineList),
    };
    if (result.tasks + result.routines === 0) {
      throw new Error('No se encontró ningún pendiente ni actividad válida en el archivo.');
    }
    return result;
  }
}
