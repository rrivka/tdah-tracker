import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { SyncService } from '../../services/sync.service';

/** Espera antes de mostrar "Sincronizando…" (para que no parpadee en cada guardado rápido). */
const SYNC_DELAY_MS = 1200;

/**
 * Franja de estado arriba de la app:
 *  - 📴 Sin conexión (los cambios se guardan en el dispositivo y se suben al volver).
 *  - 🔄 Sincronizando… (hay cambios que todavía no llegan al servidor).
 *  - ✨ Hay una versión nueva → botón "Actualizar".
 * Si todo está bien, no muestra nada.
 */
@Component({
  selector: 'app-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
})
export class StatusBarComponent {
  readonly sync = inject(SyncService);
  private readonly swUpdate = inject(SwUpdate);

  /** "Sincronizando…" visible (con un pequeño retraso). */
  readonly showSyncing = signal(false);
  /** Hay una versión nueva lista para usar. */
  readonly updateReady = signal(false);

  constructor() {
    let timer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      const pending = this.sync.pending();
      if (timer) clearTimeout(timer);
      if (!pending) {
        this.showSyncing.set(false);
        return;
      }
      timer = setTimeout(() => this.showSyncing.set(true), SYNC_DELAY_MS);
    });
    inject(DestroyRef).onDestroy(() => timer && clearTimeout(timer));

    // El service worker avisa cuando descargó una versión nueva de la app.
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'),
          takeUntilDestroyed(),
        )
        .subscribe(() => this.updateReady.set(true));
    }
  }

  /** Activa la versión nueva y recarga la página. */
  async update(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
    } finally {
      document.location.reload();
    }
  }
}
