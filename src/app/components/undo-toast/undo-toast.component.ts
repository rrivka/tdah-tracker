import { Component, inject } from '@angular/core';
import { UndoService } from '../../services/undo.service';

/** Aviso flotante abajo: "Se eliminó … · Deshacer". Lo controla UndoService. */
@Component({
  selector: 'app-undo-toast',
  template: `
    @if (undo.current(); as t) {
      <div class="undo-toast" role="status">
        <span class="undo-toast__message">{{ t.message }}</span>
        <button class="undo-toast__undo button-primary" type="button" (click)="undo.undo()">Deshacer</button>
        <button class="undo-toast__close" type="button" aria-label="Cerrar aviso" (click)="undo.dismiss()">✕</button>
      </div>
    }
  `,
  styleUrl: './undo-toast.component.scss',
})
export class UndoToastComponent {
  readonly undo = inject(UndoService);
}
