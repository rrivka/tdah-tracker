import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

/** Reloj: hora actual y fecha del día, actualizándose cada segundo. */
@Component({
  selector: 'app-clock',
  templateUrl: './clock.component.html',
  styleUrl: './clock.component.scss',
})
export class ClockComponent {
  private readonly now = signal(new Date());

  readonly time = computed(() =>
    this.now().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );

  readonly date = computed(() =>
    this.now().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  );

  constructor() {
    const id = setInterval(() => this.now.set(new Date()), 1000);
    // Detiene el intervalo cuando el componente se destruye.
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
