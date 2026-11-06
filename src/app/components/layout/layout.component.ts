import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { APP_NAME } from '../../app.constants';
import { ClockComponent } from '../clock/clock.component';
import { CalendarComponent } from '../calendar/calendar.component';
import { TaskListComponent } from '../task-list/task-list.component';
import { SettingsComponent } from '../settings/settings.component';

/** Secciones de la app (en el teléfono se ve una a la vez). */
export type Section = 'clock' | 'calendar' | 'tasks' | 'settings';

/**
 * Estructura principal: encabezado, secciones y navegación inferior.
 *
 * - Escritorio: reloj, calendario y pendientes siempre visibles; Ajustes se abre con su botón.
 * - Teléfono: solo se ve la sección activa y se cambia con la barra de abajo.
 * Todo eso se decide en layout.component.scss con la clase "is-active".
 */
@Component({
  selector: 'app-layout',
  imports: [ClockComponent, CalendarComponent, TaskListComponent, SettingsComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly tasks = inject(TaskService);

  readonly appName = APP_NAME;
  readonly section = signal<Section>('tasks');
  readonly error = this.tasks.error;
  readonly userName = computed(() => this.auth.user()?.displayName ?? this.auth.user()?.email ?? '');

  readonly navItems: { id: Section; label: string }[] = [
    { id: 'clock', label: 'Hoy' },
    { id: 'calendar', label: 'Calendario' },
    { id: 'tasks', label: 'Pendientes' },
    { id: 'settings', label: 'Ajustes' },
  ];

  show(section: Section): void {
    this.section.set(section);
  }

  /** Botón "Ajustes" del encabezado (escritorio): abre o cierra el panel. */
  toggleSettings(): void {
    this.section.update((s) => (s === 'settings' ? 'tasks' : 'settings'));
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
