import { Component, input, output } from '@angular/core';

/**
 * Ventana modal reutilizable (fondo oscurecido + recuadro centrado).
 *
 * Uso:
 *   <app-modal [open]="abierto()" title="Título" (closed)="abierto.set(false)">
 *     ...contenido...
 *   </app-modal>
 *
 * Se cierra con la ✕, tocando el fondo oscuro o con la tecla Escape.
 */
@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  host: {
    '(document:keydown.escape)': 'open() && closed.emit()',
  },
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly closed = output<void>();

  /** Id para conectar el título con la ventana (lectores de pantalla). */
  readonly titleId = 'modal-title-' + Math.random().toString(36).slice(2, 8);

  /** Solo cierra si el clic fue en el fondo, no dentro del recuadro. */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }
}
