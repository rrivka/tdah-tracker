import { Injectable, signal } from '@angular/core';

/** Cuánto tiempo se muestra el aviso con "Deshacer". */
const UNDO_MS = 6000;

export interface UndoToast {
  id: number;
  message: string;
  undo: () => void;
}

/**
 * UndoService: aviso pequeño abajo con un botón "Deshacer".
 *
 * En lugar de preguntar "¿Seguro que quieres eliminar…?", la app hace la acción al
 * instante y ofrece deshacerla durante unos segundos. Menos fricción y sin miedo a
 * equivocarte.
 *
 * Uso:  undo.show('Se eliminó "Comprar pan"', () => taskService.restore(task));
 */
@Injectable({ providedIn: 'root' })
export class UndoService {
  readonly current = signal<UndoToast | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextId = 1;

  show(message: string, undo: () => void): void {
    if (this.timer) clearTimeout(this.timer);
    this.current.set({ id: this.nextId++, message, undo });
    this.timer = setTimeout(() => this.dismiss(), UNDO_MS);
  }

  /** Ejecuta el "deshacer" del aviso actual y lo cierra. */
  undo(): void {
    this.current()?.undo();
    this.dismiss();
  }

  dismiss(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.current.set(null);
  }
}
