import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { TimerService } from '../../services/timer.service';
import { AlarmService } from '../../services/alarm.service';
import { APP_NAME } from '../../app.constants';
import { formatDuration } from '../../utils/time.utils';
import { ClockComponent } from '../clock/clock.component';
import { CalendarComponent } from '../calendar/calendar.component';
import { TaskListComponent } from '../task-list/task-list.component';
import { SettingsComponent } from '../settings/settings.component';
import { TimerComponent } from '../timer/timer.component';
import { AlarmsComponent } from '../alarms/alarms.component';
import { FloatingTimerComponent } from '../floating-timer/floating-timer.component';
import { RingingOverlayComponent } from '../ringing-overlay/ringing-overlay.component';

/** Secciones de la app (en el teléfono se ve una a la vez). */
export type Section = 'clock' | 'calendar' | 'tasks' | 'settings';
/** Herramientas debajo del reloj. */
export type TimeTool = 'timer' | 'alarms';

/**
 * Estructura principal: encabezado, secciones y navegación inferior.
 *
 * - Escritorio: reloj (+ temporizador/alarmas), calendario y pendientes siempre visibles;
 *   Ajustes se abre con su botón.
 * - Teléfono: solo se ve la sección activa (por defecto, Pendientes) y se cambia con la barra de abajo.
 * Todo eso se decide en layout.component.scss con la clase "is-active".
 *
 * También lee los accesos directos del ícono de la app (ver "shortcuts" en public/manifest.webmanifest):
 *   #/?nuevo=1                → abre Pendientes con el cursor listo para escribir
 *   #/?seccion=temporizador   → abre el temporizador
 *   #/?seccion=alarmas        → abre las alarmas
 */
@Component({
  selector: 'app-layout',
  imports: [
    ClockComponent,
    CalendarComponent,
    TaskListComponent,
    SettingsComponent,
    TimerComponent,
    AlarmsComponent,
    FloatingTimerComponent,
    RingingOverlayComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly tasks = inject(TaskService);
  readonly timer = inject(TimerService);
  // Se inyecta aquí para que las alarmas funcionen aunque no abras su pestaña.
  private readonly alarms = inject(AlarmService);

  readonly appName = APP_NAME;
  readonly section = signal<Section>('tasks');
  readonly tool = signal<TimeTool>('timer');
  /** Cada vez que aumenta, el formulario de nuevo pendiente recibe el cursor. */
  readonly focusNewTask = signal(0);

  readonly error = this.tasks.error;
  readonly userName = computed(() => this.auth.user()?.displayName ?? this.auth.user()?.email ?? '');
  readonly timerLabel = computed(() =>
    this.timer.state() === 'finished' ? '¡Tiempo!' : formatDuration(this.timer.remaining()),
  );

  readonly navItems: { id: Section; label: string }[] = [
    { id: 'clock', label: 'Reloj' },
    { id: 'calendar', label: 'Calendario' },
    { id: 'tasks', label: 'Pendientes' },
    { id: 'settings', label: 'Ajustes' },
  ];

  constructor() {
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const seccion = params.get('seccion');
        if (params.get('nuevo')) {
          this.section.set('tasks');
          this.focusNewTask.update((n) => n + 1);
        } else if (seccion === 'temporizador' || seccion === 'alarmas') {
          this.showTool(seccion === 'temporizador' ? 'timer' : 'alarms');
        } else {
          return;
        }
        // Limpia la URL para que al recargar no se repita.
        void this.router.navigate([], { queryParams: {}, replaceUrl: true });
      });
  }

  show(section: Section): void {
    this.section.set(section);
  }

  showTool(tool: TimeTool): void {
    this.tool.set(tool);
    this.section.set('clock');
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
