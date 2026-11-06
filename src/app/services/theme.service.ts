import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { ACCENTS, AccentId, THEMES, ThemeId, usesAccent } from '../themes';

const THEME_KEY = 'tdah-tracker:theme';
const ACCENT_KEY = 'tdah-tracker:accent';

/**
 * ThemeService: aplica el tema (claro/oscuro) y el color de acento.
 *
 * Funciona poniendo atributos en <html>, p. ej. <html data-theme="dark" data-accent="green">.
 * Los colores están en src/styles/_tokens.scss.
 *
 * El perfil (ProfileService) guarda la elección en Firestore y la aplica al entrar.
 * Aquí además se recuerda en este dispositivo (localStorage) para que la pantalla de
 * login ya salga con los colores correctos.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly themes = THEMES;
  readonly accents = ACCENTS;
  readonly theme = signal<ThemeId>(this.initialTheme());
  readonly accent = signal<AccentId>(this.initialAccent());

  constructor() {
    effect(() => {
      const theme = this.theme();
      const accent = this.accent();
      const root = this.document.documentElement;
      root.dataset['theme'] = theme;
      // Los temas Aero traen su propio color: ahí no se aplica el acento.
      if (usesAccent(theme)) root.dataset['accent'] = accent;
      else delete root.dataset['accent'];
      save(THEME_KEY, theme);
      save(ACCENT_KEY, accent);
      // Color de la barra del navegador/teléfono = color de fondo del tema.
      const bg = getComputedStyle(root).getPropertyValue('--color-bg').trim();
      if (bg) this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
    });
  }

  setTheme(id: ThemeId): void {
    this.theme.set(id);
  }

  setAccent(id: AccentId): void {
    this.accent.set(id);
  }

  /** Tema guardado; si no hay ninguno, el del sistema (claro u oscuro). */
  private initialTheme(): ThemeId {
    const found = THEMES.find((t) => t.id === read(THEME_KEY));
    if (found) return found.id;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private initialAccent(): AccentId {
    return ACCENTS.find((a) => a.id === read(ACCENT_KEY))?.id ?? 'blue';
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sin localStorage (p. ej. modo privado): simplemente no se recuerda.
  }
}
