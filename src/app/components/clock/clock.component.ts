import { Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import { ProfileService } from '../../services/profile.service';

/**
 * Reloj: hora actual y fecha del día, actualizándose cada segundo.
 * La hora es un botón: al tocarla emite `openTools` (el layout abre temporizador y alarmas).
 */
@Component({
  selector: 'app-clock',
  templateUrl: './clock.component.html',
  styleUrl: './clock.component.scss',
})
export class ClockComponent {
  readonly openTools = output<void>();

  private readonly now = signal(new Date());

  readonly time = computed(() =>
    this.now().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );

  readonly date = computed(() =>
    this.now().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  );

  private readonly profile = inject(ProfileService);

  /** "Buenos días, Ana" según la hora (o null si el usuario lo desactivó en su perfil). */
  readonly greeting = computed(() => {
    if (!this.profile.profile().showGreeting) return null;
    const h = this.now().getHours();
    const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    const name = this.profile.firstName();
    return name ? `${saludo}, ${name}` : saludo;
  });

  constructor() {
    const id = setInterval(() => this.now.set(new Date()), 1000);
    // Detiene el intervalo cuando el componente se destruye.
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
