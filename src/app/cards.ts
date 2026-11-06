/**
 * Tarjetas del tablero y su acomodo.
 *
 * El tablero (vista de computadora) tiene dos columnas: una angosta a la izquierda
 * y una ancha a la derecha. El usuario decide en qué columna va cada tarjeta, en
 * qué orden y cuáles ocultar (Personalización → Acomodo). Se guarda en su perfil.
 *
 * En el teléfono se ve una sección a la vez; el orden de las pestañas de abajo
 * sigue el orden de las tarjetas (primero la columna izquierda, luego la derecha).
 */

export type CardId = 'clock' | 'calendar' | 'streaks' | 'routines' | 'tasks';

/** Secciones del teléfono (una pestaña cada una). Ajustes es aparte, siempre al final. */
export type Section = 'clock' | 'calendar' | 'streaks' | 'tasks' | 'settings';

export const CARDS: { id: CardId; label: string; icon: string; section: Section }[] = [
  { id: 'clock', label: 'Reloj', icon: '🕒', section: 'clock' },
  { id: 'calendar', label: 'Calendario', icon: '📅', section: 'calendar' },
  { id: 'streaks', label: 'Rachas', icon: '🔥', section: 'streaks' },
  // Constantes y Pendientes comparten la pestaña "Pendientes" en el teléfono.
  { id: 'routines', label: 'Constantes', icon: '💊', section: 'tasks' },
  { id: 'tasks', label: 'Pendientes', icon: '✅', section: 'tasks' },
];

/** Nombre de cada pestaña del teléfono. */
export const SECTION_LABELS: Record<Section, string> = {
  clock: 'Reloj',
  calendar: 'Calendario',
  streaks: 'Rachas',
  tasks: 'Pendientes',
  settings: 'Ajustes',
};

export interface DashboardLayout {
  /** Columna angosta (izquierda), de arriba a abajo. */
  left: CardId[];
  /** Columna ancha (derecha), de arriba a abajo. */
  right: CardId[];
  /** Tarjetas ocultas (siguen en su lugar, pero no se muestran). */
  hidden: CardId[];
}

export const DEFAULT_LAYOUT: DashboardLayout = {
  left: ['clock', 'calendar'],
  right: ['streaks', 'routines', 'tasks'],
  hidden: [],
};

export function cardInfo(id: CardId) {
  return CARDS.find((c) => c.id === id)!;
}

/**
 * Valida un acomodo: cada tarjeta aparece exactamente una vez, las desconocidas se
 * quitan, las que falten se agregan donde van por defecto, y al menos una queda visible.
 */
export function sanitizeLayout(raw: Partial<DashboardLayout> | null | undefined): DashboardLayout {
  const valid = new Set<CardId>(CARDS.map((c) => c.id));
  const seen = new Set<CardId>();
  const clean = (list: unknown): CardId[] =>
    (Array.isArray(list) ? list : []).filter((id): id is CardId => {
      if (!valid.has(id as CardId) || seen.has(id as CardId)) return false;
      seen.add(id as CardId);
      return true;
    });

  const left = clean(raw?.left);
  const right = clean(raw?.right);
  for (const id of DEFAULT_LAYOUT.left) if (!seen.has(id)) left.push(id), seen.add(id);
  for (const id of DEFAULT_LAYOUT.right) if (!seen.has(id)) right.push(id), seen.add(id);

  let hidden = (Array.isArray(raw?.hidden) ? raw.hidden : []).filter((id) => valid.has(id));
  if (hidden.length >= CARDS.length) hidden = []; // nunca todo oculto
  return { left, right, hidden: [...new Set(hidden)] };
}
