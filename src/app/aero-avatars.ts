/**
 * Avatares de la línea Frutiger Aero: figuras de "gel" brillante dibujadas en SVG
 * (components/aero-avatar). Se eligen en Personalización → Apariencia y funcionan
 * con cualquier tema.
 *
 * Cada avatar tiene 3 tonos (claro → principal → profundo) y opcionalmente un accesorio
 * o una forma distinta. Para agregar uno nuevo, añade una línea a AERO_AVATARS.
 *
 * Nota: estos colores son parte del dibujo del avatar (como los de una imagen),
 * por eso viven aquí y no en los tokens del tema.
 */
export type AeroAccessory = 'none' | 'cone' | 'antenna';
export type AeroShape = 'buddy' | 'cat';

export interface AeroAvatar {
  id: string;
  label: string;
  light: string;
  main: string;
  deep: string;
  shape: AeroShape;
  accessory: AeroAccessory;
  /** Brillo iridiscente extra (michi de gelatina). */
  sheen?: string;
}

const buddy = (id: string, label: string, light: string, main: string, deep: string): AeroAvatar => ({
  id,
  label,
  light,
  main,
  deep,
  shape: 'buddy',
  accessory: 'none',
});

export const AERO_AVATARS: AeroAvatar[] = [
  // ---- Colores (fila por fila, como la referencia) ----
  buddy('rojo', 'Rojo', '#ff8a8a', '#e0262e', '#8c0b12'),
  buddy('fuego', 'Fuego', '#ffd166', '#ff5a1f', '#b3240b'),
  buddy('atardecer', 'Atardecer', '#ffe08a', '#ff4f8b', '#b1125c'),
  buddy('rosa-claro', 'Rosa claro', '#fff0f6', '#f7a8c7', '#d9729c'),
  buddy('ambar', 'Ámbar', '#ffe7a3', '#ffb21a', '#c46a00'),
  buddy('amarillo', 'Amarillo', '#fff6c2', '#ffd84a', '#c89a12'),
  buddy('lima', 'Lima', '#f3ffd6', '#c8ee8a', '#86b84a'),
  buddy('verde', 'Verde', '#c9f59a', '#4fbf2a', '#1f6e12'),
  buddy('menta', 'Menta', '#c8fbd9', '#2ec29a', '#0f7a63'),
  buddy('aqua', 'Aqua', '#c8fbff', '#2fd6e6', '#0a8aa8'),
  buddy('azul', 'Azul', '#bfe3ff', '#2f8bff', '#0b4fc4'),
  buddy('oceano', 'Océano', '#8fe0ff', '#0f8fd0', '#064b7a'),
  buddy('lavanda', 'Lavanda', '#f0e6ff', '#b79cff', '#6e52d6'),
  buddy('violeta', 'Violeta', '#e2d4ff', '#8a5cff', '#4b23b8'),
  buddy('magenta', 'Magenta', '#ffc2ea', '#e0168f', '#7a0a55'),
  buddy('lila', 'Lila', '#fde6ff', '#e3a6f2', '#a75cc2'),
  buddy('chicle', 'Chicle', '#ffe0ea', '#ff8fb3', '#d4507d'),
  buddy('cristal', 'Cristal', '#ffffff', '#e8eef4', '#a9b6c4'),
  buddy('plata', 'Plata', '#f2f4f6', '#a9b0b8', '#4f565e'),
  buddy('obsidiana', 'Obsidiana', '#9aa0a8', '#2b2f35', '#050608'),

  // ---- Especiales ----
  { id: 'cono', label: 'Con cono', light: '#ffe2a8', main: '#ff8a1f', deep: '#d9560b', shape: 'buddy', accessory: 'cone' },
  { id: 'antenas', label: 'Antenas', light: '#8ff6ff', main: '#2fd0f0', deep: '#3a3fe0', shape: 'buddy', accessory: 'antenna' },
  {
    id: 'michi',
    label: 'Michi de gelatina',
    light: '#e9fffe',
    main: '#59d6d6',
    deep: '#1d8f9e',
    shape: 'cat',
    accessory: 'none',
    sheen: '#c9a8ff',
  },
];

export function findAeroAvatar(id: string | undefined | null): AeroAvatar | undefined {
  return id ? AERO_AVATARS.find((a) => a.id === id) : undefined;
}
