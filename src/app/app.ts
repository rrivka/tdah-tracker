import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

/** Componente raíz: solo muestra la ruta actual. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  // Se inyecta aquí para que el tema guardado se aplique desde el arranque.
  private readonly theme = inject(ThemeService);
}
