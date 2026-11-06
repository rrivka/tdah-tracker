import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { DEFAULT_PROFILE, Profile } from '../models/profile.model';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { ThemeService } from './theme.service';
import { ACCENTS, AccentId, THEMES, ThemeId } from '../themes';
import { sanitizeLayout } from '../cards';

/** Qué mostrar como avatar. */
export type Avatar = { kind: 'emoji'; value: string } | { kind: 'photo'; value: string } | { kind: 'initial'; value: string };

/**
 * ProfileService: el perfil del usuario (nombre, avatar, color, tema, pantalla de inicio).
 *
 * - Se guarda en Firestore (users/{uid}/profile/main) → se sincroniza entre dispositivos
 *   y cada cuenta tiene el suyo.
 * - Al cargar, aplica su tema y color con ThemeService.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly auth = inject(AuthService);
  private readonly storage = inject(StorageService);
  private readonly theme = inject(ThemeService);

  private readonly _profile = signal<Profile>(DEFAULT_PROFILE);
  /** Perfil actual (con valores por defecto si el usuario aún no lo ha editado). */
  readonly profile = this._profile.asReadonly();
  /** true cuando ya llegó el perfil desde Firestore (o se confirmó que no existe). */
  readonly loaded = signal(false);

  /** Nombre a mostrar: el apodo del perfil, o el de Google, o el correo. */
  readonly displayName = computed(() => {
    const user = this.auth.user();
    return this._profile().displayName.trim() || user?.displayName || user?.email || '';
  });

  /** Solo el primer nombre (para el saludo). */
  readonly firstName = computed(() => this.displayName().split(/\s+/)[0] ?? '');

  readonly avatar = computed<Avatar>(() => {
    const emoji = this._profile().avatarEmoji.trim();
    if (emoji) return { kind: 'emoji', value: emoji };
    const photo = this.auth.user()?.photoURL;
    if (photo) return { kind: 'photo', value: photo };
    return { kind: 'initial', value: (this.displayName().charAt(0) || '?').toUpperCase() };
  });

  readonly email = computed(() => this.auth.user()?.email ?? '');
  readonly googlePhoto = computed(() => this.auth.user()?.photoURL ?? null);
  readonly googleName = computed(() => this.auth.user()?.displayName ?? '');

  constructor() {
    effect((onCleanup) => {
      const user = this.auth.user();
      untracked(() => {
        this._profile.set(DEFAULT_PROFILE);
        this.loaded.set(false);
      });
      if (!user) return;
      const unsubscribe = this.storage.watchProfile(
        user.uid,
        (data) => {
          const profile = sanitize(data);
          this._profile.set(profile);
          this.loaded.set(true);
          // Aplicar el tema y el color guardados en el perfil.
          if (profile.theme) this.theme.setTheme(profile.theme);
          this.theme.setAccent(profile.accent);
        },
        () => this.loaded.set(true),
      );
      onCleanup(unsubscribe);
    });
  }

  /** Cambia uno o varios campos y guarda. */
  update(changes: Partial<Profile>): void {
    const user = this.auth.user();
    if (!user) return;
    const next: Profile = sanitize({ ...this._profile(), ...changes, updatedAt: new Date().toISOString() });
    this._profile.set(next); // se ve al instante, aunque no haya internet
    if (changes.theme) this.theme.setTheme(changes.theme);
    if (changes.accent) this.theme.setAccent(changes.accent);
    this.storage.saveProfile(user.uid, next).catch((e: Error) => console.error('No se pudo guardar el perfil', e));
  }
}

/** Completa y valida los datos del perfil (por si faltan campos o vienen valores raros). */
function sanitize(data: Partial<Profile> | null): Profile {
  const p = { ...DEFAULT_PROFILE, ...(data ?? {}) };
  return {
    displayName: String(p.displayName ?? '').slice(0, 40),
    avatarEmoji: String(p.avatarEmoji ?? '').slice(0, 8),
    accent: ACCENTS.some((a) => a.id === p.accent) ? (p.accent as AccentId) : DEFAULT_PROFILE.accent,
    theme: THEMES.some((t) => t.id === p.theme) ? (p.theme as ThemeId) : undefined,
    startSection: ['today', 'tasks', 'streaks', 'calendar', 'clock'].includes(p.startSection)
      ? p.startSection
      : DEFAULT_PROFILE.startSection,
    showGreeting: p.showGreeting !== false,
    layout: sanitizeLayout(p.layout),
    updatedAt: p.updatedAt,
  };
}
