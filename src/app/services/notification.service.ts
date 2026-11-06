import { Injectable, signal } from '@angular/core';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

/**
 * NotificationService: notificaciones del sistema (las que salen aunque estés en otra ventana).
 * Se usan cuando termina el temporizador o suena una alarma.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly permission = signal<NotificationPermissionState>(
    'Notification' in window ? Notification.permission : 'unsupported',
  );

  /** Pide permiso (solo funciona durante un clic del usuario). */
  async request(): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    this.permission.set(await Notification.requestPermission());
  }

  async show(title: string, body: string): Promise<void> {
    if (this.permission() !== 'granted') return;
    const options: NotificationOptions & { data?: unknown } = {
      body,
      icon: 'icons/icon-192x192.png',
      tag: 'tdah-tracker-alert', // una nueva reemplaza a la anterior
      requireInteraction: true,
      // Al tocar la notificación, el service worker de Angular abre/enfoca la app.
      data: { onActionClick: { default: { operation: 'focusLastFocusedOrOpen', url: './' } } },
    };
    try {
      // En Android solo funcionan las notificaciones a través del service worker.
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return;
      }
    } catch {
      // seguimos con la opción simple
    }
    try {
      new Notification(title, options);
    } catch {
      // Este navegador no permite notificaciones aquí.
    }
  }
}
