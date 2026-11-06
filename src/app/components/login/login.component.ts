import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { APP_NAME } from '../../app.constants';

/** Pantalla de inicio de sesión con Google. */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly appName = APP_NAME;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** Casilla "Mantener la sesión iniciada" (recuerda la última elección). */
  readonly remember = signal(this.auth.rememberPreference());

  constructor() {
    // Aplica la preferencia guardada desde que se abre la pantalla.
    void this.auth.setRemember(this.remember());
  }

  setRemember(value: boolean): void {
    this.remember.set(value);
    void this.auth.setRemember(value);
  }

  async login(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.loginWithGoogle();
      await this.router.navigateByUrl('/');
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      // Cerrar la ventana de Google no es un error que haya que mostrar.
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        this.error.set('No se pudo iniciar sesión. ' + (code ?? (e as Error).message));
      }
    } finally {
      this.loading.set(false);
    }
  }
}
