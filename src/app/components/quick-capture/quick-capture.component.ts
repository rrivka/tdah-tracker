import { Component, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';

/**
 * Captura rápida (⚡): un solo campo para anotar una idea en un segundo.
 * Enter guarda y deja el campo listo para la siguiente. Todo va a la bandeja
 * "Por clasificar" de Pendientes, donde después decides qué es cada cosa.
 */
@Component({
  selector: 'app-quick-capture',
  imports: [FormsModule],
  templateUrl: './quick-capture.component.html',
  styleUrl: './quick-capture.component.scss',
})
export class QuickCaptureComponent {
  private readonly tasks = inject(TaskService);

  readonly text = signal('');
  /** Lo anotado mientras la ventana está abierta (para que veas que sí se guardó). */
  readonly saved = signal<string[]>([]);
  readonly inboxCount = this.tasks.inboxCount;

  private readonly input = viewChild<ElementRef<HTMLInputElement>>('captureInput');

  constructor() {
    // El cursor queda listo para escribir apenas se abre.
    afterNextRender(() => this.input()?.nativeElement.focus());
  }

  save(): void {
    const value = this.text().trim();
    if (!value) return;
    this.tasks.capture(value);
    this.saved.update((list) => [value, ...list].slice(0, 5));
    this.text.set('');
    this.input()?.nativeElement.focus();
  }
}
