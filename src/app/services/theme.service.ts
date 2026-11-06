import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { THEMES, ThemeId } from '../themes';

const STORAGE_KEY = 'tdah-tracker:theme';

/**
 * ThemeService: cambia el tema y lo recuerda en este dispositivo (localStorage).
 *
 * Funciona poniendo el atributo data-theme en <html>, p. ej. <html data-theme="dark">.
 * Los colores de cada tema están en src/styles/_tokens.scss.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly themes = THEMES;
  readonly theme = signal<ThemeId>(this.initialTheme());

  constructor() {
    effect(() => {
      const theme = this.theme();
      const root = this.document.documentElement;
      root.dataset['theme'] = theme;
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Sin localStorage (p. ej. modo privado): simplemente no se recuerda.
      }
      // Color de la barra del navegador/teléfono = color de fondo del tema.
      const bg = getComputedStyle(root).getPropertyValue('--color-bg').trim();
      if (bg) this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
    });
  }

  setTheme(id: ThemeId): void {
    this.theme.set(id);
  }

  /** Tema guardado; si no hay ninguno, el del sistema (claro u oscuro). */
  private initialTheme(): ThemeId {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignorar
    }
    const found = THEMES.find((t) => t.id === saved);
    if (found) return found.id;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
