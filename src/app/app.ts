import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { StatusBarComponent } from './components/status-bar/status-bar.component';

/**
 * Componente raíz: la franja de estado (sin conexión / sincronizando / versión nueva)
 * y la pantalla actual (login o tablero).
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StatusBarComponent],
  template: '<app-status-bar /><router-outlet />',
})
export class App {
  // Se inyecta aquí para que el tema guardado se aplique desde el arranque.
  private readonly theme = inject(ThemeService);
}
