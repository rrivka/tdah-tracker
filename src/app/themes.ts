/**
 * Lista de temas que aparecen en Ajustes.
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
