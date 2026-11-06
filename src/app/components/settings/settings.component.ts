import { Component, computed, inject, signal } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { BackupService } from '../../services/backup.service';
import { RoutineService } from '../../services/routine.service';
import { StreakService } from '../../services/streak.service';
import { NotificationService } from '../../services/notification.service';
import { todayKey } from '../../utils/date.utils';

/** Pestaña "Ajustes" de Personalización: respaldo (exportar/importar JSON) y notificaciones. */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly taskService = inject(TaskService);
  private readonly backup = inject(BackupService);
  private readonly routineService = inject(RoutineService);
  private readonly streakService = inject(StreakService);
  private readonly notifications = inject(NotificationService);

  readonly notificationPermission = this.notifications.permission;

  readonly taskCount = computed(() => this.taskService.tasks().length);
  readonly routineCount = computed(() => this.routineService.routines().length);
  readonly streakCount = computed(() => this.streakService.streaks().length);

  /** Mensaje después de importar (éxito o error). */
  readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  enableNotifications(): void {
    void this.notifications.request();
  }

  /** Descarga pendientes y actividades constantes como archivo .json. */
  exportTasks(): void {
    const blob = new Blob([this.backup.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pendientes-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Lee el archivo elegido y lo importa. */
  async importTasks(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;
    try {
      const r = this.backup.importJson(await file.text());
      this.message.set({
        type: 'success',
        text: `Se importaron ${r.tasks} pendiente(s), ${r.routines} actividad(es) constante(s) y ${r.streaks} racha(s).`,
      });
    } catch (e) {
      this.message.set({ type: 'error', text: (e as Error).message });
    } finally {
      inputEl.value = ''; // permite volver a elegir el mismo archivo
    }
  }
}
