import { AccentId, ThemeId } from '../themes';
import { DEFAULT_LAYOUT, DashboardLayout } from '../cards';

/** Secciones que se pueden elegir como pantalla de inicio en el teléfono. */
export type StartSection = 'today' | 'tasks' | 'streaks' | 'calendar' | 'clock';

/**
 * Perfil del usuario: cómo quiere ver la app.
 * Se guarda en Firestore en users/{uid}/profile/main, así se sincroniza entre dispositivos
 * y cada persona que entra con su cuenta tiene el suyo.
 */
export interface Profile {
  /** Nombre o apodo para mostrar. Vacío = se usa el nombre de la cuenta de Google. */
  displayName: string;
  /** Emoji como avatar. Vacío = foto de Google (o la inicial si no hay foto). */
  avatarEmoji: string;
  /** Avatar de la línea Frutiger Aero (id de AERO_AVATARS). Tiene prioridad sobre el emoji. */
  avatarAero?: string;
  /** Color principal de la interfaz (ver ACCENTS en src/app/themes.ts). */
  accent: AccentId;
  /** Tema guardado en el perfil. Sin valor = el de este dispositivo. */
  theme?: ThemeId;
  /** Qué sección se abre primero en el teléfono. */
  startSection: StartSection;
  /** ¿Mostrar el saludo ("Buenas noches, Ana") en el reloj? */
  showGreeting: boolean;
  /** Acomodo de las tarjetas del tablero (Personalización → Acomodo). */
  layout: DashboardLayout;
  updatedAt?: string;
}

export const DEFAULT_PROFILE: Profile = {
  displayName: '',
  avatarEmoji: '',
  accent: 'blue',
  startSection: 'today',
  showGreeting: true,
  layout: DEFAULT_LAYOUT,
};
