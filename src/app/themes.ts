/**
 * Lista de temas que aparecen en el perfil.
 *
 * Para agregar un tema nuevo:
 *   1. Crea su bloque de variables en src/styles/_tokens.scss:  [data-theme='mi-tema'] { ... }
 *   2. Agrégalo aquí:  { id: 'mi-tema', label: 'Mi tema' }
 * No hay que tocar ningún componente.
 */
export const THEMES = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

/**
 * Colores de acento (el color principal: botones, día de hoy, selección).
 * Funcionan encima de cualquier tema.
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
