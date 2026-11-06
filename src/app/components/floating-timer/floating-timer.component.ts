import { Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject } from '@angular/core';
import { TimerService } from '../../services/timer.service';
import { ThemeService } from '../../services/theme.service';
import { TaskService } from '../../services/task.service';
import { UndoService } from '../../services/undo.service';
import { formatDuration } from '../../utils/time.utils';

/**
 * Temporizador flotante.
 *
 * - Si hay ventana Picture-in-Picture (Chrome/Edge/Opera de escritorio), este componente
 *   se "muda" a esa ventana: queda encima de todos los programas.
 * - Si no, se muestra como un recuadro fijo en la esquina de la app.
 *
 * Mudar el elemento a otra ventana mantiene funcionando los botones y los signals,
 * porque sigue siendo el mismo componente de Angular.
 */
@Component({
  selector: 'app-floating-timer',
  templateUrl: './floating-timer.component.html',
  styleUrl: './floating-timer.component.scss',
  host: {
    class: 'floating-timer',
    '[class.floating-timer--pip]': 'inPip()',
    '[class.floating-timer--overlay]': '!inPip()',
  },
})
export class FloatingTimerComponent {
  readonly timer = inject(TimerService);
  private readonly theme = inject(ThemeService);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  private readonly tasks = inject(TaskService);
  private readonly undo = inject(UndoService);

  readonly inPip = computed(() => this.timer.pipWindow() !== null);
  readonly display = computed(() => formatDuration(this.timer.remaining()));

  /** Modo enfoque: "✓ Sí, ya lo terminé" desde la ventana flotante. */
  focusDone(taskId: string, title: string): void {
    this.tasks.complete(taskId);
    this.timer.endFocus();
    this.undo.show(`✓ ${title}`, () => this.tasks.toggle(taskId));
  }

  constructor() {
    afterNextRender(() => {
      const pip = this.timer.pipWindow();
      if (!pip) return;
      copyStyles(document, pip.document);
      pip.document.title = 'Temporizador';
      pip.document.body.classList.add('floating-timer-window');
      pip.document.body.append(this.host);
    });

    // La ventana flotante usa el mismo tema que la app.
    effect(() => {
      const theme = this.theme.theme();
      const pip = this.timer.pipWindow();
      if (pip) pip.document.documentElement.dataset['theme'] = theme;
    });

    // Al cerrarse, quitamos el elemento de donde esté (app o ventana flotante).
    inject(DestroyRef).onDestroy(() => this.host.remove());
  }
}

/** Copia todas las hojas de estilo de la app a la ventana flotante. */
function copyStyles(from: Document, to: Document): void {
  for (const sheet of Array.from(from.styleSheets)) {
    try {
      const style = to.createElement('style');
      style.textContent = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join('\n');
      to.head.append(style);
    } catch {
      // Hojas de otro dominio: las enlazamos en vez de copiarlas.
      if (sheet.href) {
        const link = to.createElement('link');
        link.rel = 'stylesheet';
        link.href = sheet.href;
        to.head.append(link);
      }
    }
  }
}
