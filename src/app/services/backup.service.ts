import { Injectable, inject } from '@angular/core';
import { TaskService } from './task.service';
import { RoutineService } from './routine.service';
import { StreakService } from './streak.service';

export interface ImportResult {
  tasks: number;
  routines: number;
  streaks: number;
}

/**
 * BackupService: exportar e importar el respaldo JSON (pendientes + actividades constantes + rachas).
 *
 * Formato del archivo:
 *   { app, version, exportedAt, tasks: [...], routines: [...], streaks: [...] }
 * También acepta respaldos viejos (sin routines/streaks) o una lista suelta de pendientes.
 */
@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly tasks = inject(TaskService);
  private readonly routines = inject(RoutineService);
  private readonly streaks = inject(StreakService);

  exportJson(): string {
    return JSON.stringify(
      {
        app: 'tdah-tracker',
        version: 3,
        exportedAt: new Date().toISOString(),
        tasks: this.tasks.tasks(),
        routines: this.routines.exportList(),
        streaks: this.streaks.exportList(),
      },
      null,
      2,
    );
  }

  /** Importa un respaldo. Devuelve cuántos de cada tipo. Lanza Error con mensaje claro si no sirve. */
  importJson(text: string): ImportResult {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('El archivo no es un JSON válido.');
    }
    const obj = (Array.isArray(data) ? { tasks: data } : data) as Record<string, unknown> | null;
    const list = (key: string): unknown[] => (Array.isArray(obj?.[key]) ? (obj[key] as unknown[]) : []);

    const result: ImportResult = {
      tasks: this.tasks.importList(list('tasks')),
      routines: this.routines.importList(list('routines')),
      streaks: this.streaks.importList(list('streaks')),
    };
    if (result.tasks + result.routines + result.streaks === 0) {
      throw new Error('No se encontró nada válido para importar en el archivo.');
    }
    return result;
  }
}
