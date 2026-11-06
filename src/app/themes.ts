/**
 * Temas que aparecen en Personalización → Apariencia.
 *
 * Para agregar un tema nuevo:
 *   1. Crea su bloque de variables en src/styles/_tokens.scss:  [data-theme='mi-tema'] { ... }
 *   2. Agrégalo aquí con su grupo:  { id: 'mi-tema', label: 'Mi tema', group: 'basic' }
 * No hay que tocar ningún componente.
 *
 * Grupos:
 *   - 'basic': temas simples (usan el "color de acento" que elijas).
 *   - 'aero':  Frutiger Aero (cada variante trae su propio color; el acento no aplica).
 */
export const THEMES = [
  { id: 'light', label: 'Claro', group: 'basic' },
  { id: 'dark', label: 'Oscuro', group: 'basic' },
  { id: 'aero-sky', label: 'Cielo', group: 'aero' },
  { id: 'aero-aqua', label: 'Agua', group: 'aero' },
  { id: 'aero-eco', label: 'Eco', group: 'aero' },
  { id: 'aero-sakura', label: 'Sakura', group: 'aero' },
  { id: 'aero-lila', label: 'Lila', group: 'aero' },
  { id: 'aero-pecera', label: 'Pecera', group: 'aero' },
  { id: 'aero-noche', label: 'Noche', group: 'aero' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export type ThemeGroup = (typeof THEMES)[number]['group'];

/** Nombres de los grupos (títulos en Apariencia). */
export const THEME_GROUPS: { id: ThemeGroup; label: string; help: string }[] = [
  { id: 'basic', label: 'Básicos', help: 'Sencillos. Puedes elegir su color abajo.' },
  { id: 'aero', label: 'Frutiger Aero', help: 'Cielo, burbujas, vidrio y brillo. Cada variante trae su color.' },
];

/** ¿Este tema usa el color de acento? (los Aero no) */
export function usesAccent(theme: ThemeId): boolean {
  return THEMES.find((t) => t.id === theme)?.group === 'basic';
}

/**
 * Colores de acento (el color principal: botones, día de hoy, selección).
 * Solo para los temas del grupo 'basic'.
 *
 * Para agregar uno nuevo:
 *   1. En src/styles/_tokens.scss crea su bloque claro  [data-accent='mi-color'] { ... }
 *      y su bloque oscuro  [data-theme='dark'][data-accent='mi-color'] { ... }
 *   2. Agrégalo aquí:  { id: 'mi-color', label: 'Mi color' }
 */
export const ACCENTS = [
  { id: 'blue', label: 'Azul' },
  { id: 'green', label: 'Verde' },
  { id: 'purple', label: 'Morado' },
  { id: 'pink', label: 'Rosa' },
  { id: 'teal', label: 'Turquesa' },
] as const;

export type AccentId = (typeof ACCENTS)[number]['id'];
