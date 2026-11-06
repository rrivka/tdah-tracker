import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';

/**
 * SyncService: ¿hay internet? ¿quedan cambios por subir a Firestore?
 *
 * - `online`: lo dice el navegador (eventos online/offline).
 * - `pending`: StorageService le pasa cada escritura con `track()`. Con la caché offline,
 *   la escritura se aplica al instante en el dispositivo, pero su promesa termina solo
 *   cuando el servidor la confirma; mientras tanto cuenta como "pendiente".
 *
 * El encabezado lo usa para mostrar "📴 Sin conexión" o "🔄 Sincronizando…".
 */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly window = inject(DOCUMENT).defaultView;

  readonly online = signal(this.window?.navigator.onLine ?? true);
  private readonly pendingCount = signal(0);
  /** true si hay cambios guardados en el dispositivo que aún no llegan al servidor. */
  readonly pending = computed(() => this.pendingCount() > 0);

  constructor() {
    this.window?.addEventListener('online', () => this.online.set(true));
    this.window?.addEventListener('offline', () => this.online.set(false));
  }

  /** Registra una escritura y la devuelve tal cual (para encadenar). */
  track<T>(promise: Promise<T>): Promise<T> {
    this.pendingCount.update((n) => n + 1);
    const done = () => this.pendingCount.update((n) => Math.max(0, n - 1));
    promise.then(done, done);
    return promise;
  }
}
