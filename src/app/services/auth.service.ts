import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  GoogleAuthProvider,
  User,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';

/** Dónde se guarda la preferencia "Mantener la sesión iniciada". */
const REMEMBER_KEY = 'tdah-tracker:remember-me';

/**
 * AuthService: inicio y cierre de sesión con Google.
 *
 * `user` es un signal:
 *   - undefined → todavía no sabemos (Firebase está revisando si había sesión guardada)
 *   - null      → no hay sesión
 *   - User      → sesión iniciada
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  private readonly _user = signal<User | null | undefined>(undefined);
  /** Usuario actual (solo lectura para el resto de la app). */
  readonly user = this._user.asReadonly();

  /** Se resuelve cuando Firebase ya sabe si hay sesión o no (lo usa el guard). */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = new Promise((resolve) => {
      onAuthStateChanged(this.auth, (user) => {
        this._user.set(user);
        resolve();
      });
    });
  }

  /** Última elección de "Mantener la sesión iniciada" en este dispositivo (por defecto: sí). */
  rememberPreference(): boolean {
    try {
      return localStorage.getItem(REMEMBER_KEY) !== 'false';
    } catch {
      return true;
    }
  }

  /**
   * "Mantener la sesión iniciada":
   *   true  = la sesión se guarda en el dispositivo (sigue abierta al volver).
   *   false = la sesión se borra al cerrar el navegador.
   * Se llama al cambiar la casilla (antes del clic en "Entrar"), para que la ventana
   * de Google se abra sin esperas: algunos navegadores bloquean ventanas que tardan.
   */
  async setRemember(remember: boolean): Promise<void> {
    try {
      localStorage.setItem(REMEMBER_KEY, String(remember));
    } catch {
      // sin localStorage
    }
    await setPersistence(this.auth, remember ? browserLocalPersistence : browserSessionPersistence);
  }

  /** Abre la ventana de Google. Si el navegador bloquea la ventana emergente, usa redirección. */
  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(this.auth, provider);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(this.auth, provider);
        return;
      }
      throw error;
    }
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }
}
