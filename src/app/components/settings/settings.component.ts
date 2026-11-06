import { Component, computed, inject, signal } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { ThemeId } from '../../themes';
import { todayKey } from '../../utils/date.utils';

/** Ajustes: tema, respaldo (exportar/importar JSON) y cuenta. */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly themeService = inject(ThemeService);
  private readonly taskService = inject(TaskService);
  private readonly auth = inject(AuthService);

  readonly themes = this.themeService.themes;
  readonly theme = this.themeService.theme;
  readonly email = computed(() => this.auth.user()?.email ?? '');
  readonly taskCount = computed(() => this.taskService.tasks().length);

  /** Mensaje después de importar (éxito o error). */
  readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  setTheme(id: ThemeId): void {
    this.themeService.setTheme(id);
  }

  /** Descarga todos los pendientes como archivo .json. */
  exportTasks(): void {
    const blob = new Blob([this.taskService.exportJson()], { type: 'application/json' });
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
      const count = this.taskService.importJson(await file.text());
      this.message.set({ type: 'success', text: `Se importaron ${count} pendiente(s).` });
    } catch (e) {
      this.message.set({ type: 'error', text: (e as Error).message });
    } finally {
      inputEl.value = ''; // permite volver a elegir el mismo archivo
    }
  }
}
