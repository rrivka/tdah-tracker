import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';

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
