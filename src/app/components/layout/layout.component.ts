import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
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
import { TimerComponent } from '../timer/timer.component';
import { AlarmsComponent } from '../alarms/alarms.component';
import { FloatingTimerComponent } from '../floating-timer/floating-timer.component';
import { RingingOverlayComponent } from '../ringing-overlay/ringing-overlay.component';
import { ModalComponent } from '../modal/modal.component';
import { RoutineListComponent } from '../routine-list/routine-list.component';
import { RoutineService } from '../../services/routine.service';
import { StreakBoardComponent } from '../streak-board/streak-board.component';
import { CreateDialogComponent, CreateRequest, CreateType } from '../create-dialog/create-dialog.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { ProfileComponent } from '../profile/profile.component';
import { ProfileService } from '../../services/profile.service';
import { TodayCardComponent } from '../today-card/today-card.component';
import { UndoToastComponent } from '../undo-toast/undo-toast.component';
import { CardId, SECTION_LABELS, Section, cardInfo } from '../../cards';

/** Herramientas debajo del reloj. */
export type TimeTool = 'timer' | 'alarms';

/**
 * Estructura principal: encabezado, secciones y navegación inferior.
 *
 * - Escritorio: dos columnas de tarjetas según el acomodo del perfil (ver src/app/cards.ts);
 *   Ajustes (respaldo, notificaciones) está en Personalización, que se abre con el avatar.
 * - Temporizador y alarmas: ventana modal que se abre al tocar la hora del reloj.
 * - Teléfono: solo se ve la sección activa y se cambia con la barra de abajo
 *   (las pestañas siguen el orden del acomodo).
 * Todo eso se decide en layout.component.scss con la clase "is-active".
 *
 * También lee los accesos directos del ícono de la app (ver "shortcuts" en public/manifest.webmanifest):
 *   #/?nuevo=1                → abre la ventana "Agregar" con el cursor listo para escribir
 *   #/?seccion=temporizador   → abre el temporizador
 *   #/?seccion=alarmas        → abre las alarmas
 */
@Component({
  selector: 'app-layout',
  imports: [
    ClockComponent,
    CalendarComponent,
    TaskListComponent,
    TimerComponent,
    AlarmsComponent,
    FloatingTimerComponent,
    RingingOverlayComponent,
    ModalComponent,
    RoutineListComponent,
    StreakBoardComponent,
    CreateDialogComponent,
    AvatarComponent,
    ProfileComponent,
    TodayCardComponent,
    UndoToastComponent,
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
  // Igual con los recordatorios de actividades constantes.
  private readonly routines = inject(RoutineService);
  private readonly profile = inject(ProfileService);

  readonly appName = APP_NAME;
  readonly section = signal<Section>('tasks');
  readonly tool = signal<TimeTool>('timer');
  /** ¿Está abierta la ventana de temporizador/alarmas? (se abre tocando la hora) */
  readonly toolsOpen = signal(false);
  /** ¿Está abierta la ventana "Mi perfil"? */
  readonly profileOpen = signal(false);
  /** true si un acceso directo ya eligió la sección (entonces no se aplica la pantalla de inicio). */
  private sectionChosen = false;
  /** Último pedido de abrir la ventana "Agregar" (ver requestCreate). */
  readonly createRequest = signal<CreateRequest | null>(null);

  readonly error = this.tasks.error;
  /** Nombre del perfil (apodo) o, si no hay, el de Google. */
  readonly userName = this.profile.displayName;
  readonly timerLabel = computed(() =>
    this.timer.state() === 'finished' ? '¡Tiempo!' : formatDuration(this.timer.remaining()),
  );

  /** Columnas del tablero con sus tarjetas visibles (según el acomodo del perfil). */
  readonly columns = computed(() => {
    const { left, right, hidden } = this.profile.profile().layout;
    const visible = (ids: CardId[]) => ids.filter((id) => !hidden.includes(id));
    return [
      { id: 'left', cards: visible(left) },
      { id: 'right', cards: visible(right) },
    ].filter((c) => c.cards.length > 0);
  });

  /** Pestañas del teléfono: en el orden de las tarjetas visibles. */
  readonly navItems = computed(() => {
    const sections: Section[] = [];
    for (const col of this.columns()) {
      for (const card of col.cards) {
        const s = cardInfo(card).section;
        if (!sections.includes(s)) sections.push(s);
      }
    }
    return sections.map((id) => ({ id, label: SECTION_LABELS[id] }));
  });

  /** Sección del teléfono a la que pertenece una tarjeta. */
  sectionOf(card: CardId): Section {
    return cardInfo(card).section;
  }

  constructor() {
    // Si se oculta la tarjeta de la pestaña actual, saltar a la primera pestaña disponible.
    effect(() => {
      const items = this.navItems();
      const current = this.section();
      if (!items.some((i) => i.id === current)) untracked(() => this.section.set(items[0].id));
    });

    // Pantalla de inicio del perfil (solo la primera vez que carga el perfil).
    effect(() => {
      if (!this.profile.loaded()) return;
      untracked(() => {
        if (!this.sectionChosen) this.section.set(this.profile.profile().startSection);
        this.sectionChosen = true;
      });
    });

    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const seccion = params.get('seccion');
        if (params.get('nuevo')) {
          this.section.set('tasks');
          this.requestCreate('task');
        } else if (seccion === 'temporizador' || seccion === 'alarmas') {
          this.showTool(seccion === 'temporizador' ? 'timer' : 'alarms');
        } else {
          return;
        }
        this.sectionChosen = true; // el acceso directo manda sobre la pantalla de inicio
        // Limpia la URL para que al recargar no se repita.
        void this.router.navigate([], { queryParams: {}, replaceUrl: true });
      });
  }

  /** Abre la ventana "Agregar" en la pestaña indicada. */
  requestCreate(type: CreateType): void {
    this.createRequest.set({ type, n: (this.createRequest()?.n ?? 0) + 1 });
  }

  show(section: Section): void {
    this.section.set(section);
  }

  /** Abre la ventana de temporizador/alarmas en la pestaña indicada. */
  showTool(tool: TimeTool): void {
    this.tool.set(tool);
    this.toolsOpen.set(true);
  }

  async logout(): Promise<void> {
    // Que el temporizador no siga corriendo para la siguiente persona que entre.
    this.timer.reset();
    this.timer.closeFloating();
    this.profileOpen.set(false);
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
