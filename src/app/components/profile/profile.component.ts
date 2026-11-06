import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { ThemeService } from '../../services/theme.service';
import { StartSection } from '../../models/profile.model';
import { AccentId, THEME_GROUPS, ThemeId, usesAccent } from '../../themes';
import { AvatarComponent } from '../avatar/avatar.component';
import { LayoutEditorComponent } from '../layout-editor/layout-editor.component';

type Tab = 'profile' | 'appearance' | 'layout';

/**
 * Personalización (se abre tocando el avatar del encabezado). Tres pestañas:
 *  - Perfil: nombre, avatar, pantalla de inicio, saludo y cuenta.
 *  - Apariencia: temas básicos (con color de acento) y Frutiger Aero.
 *  - Acomodo: ordenar, mover y ocultar las tarjetas del tablero.
 * Los cambios de Perfil y Apariencia se guardan al momento; el Acomodo tiene su botón Guardar.
 */
@Component({
  selector: 'app-profile',
  imports: [FormsModule, AvatarComponent, LayoutEditorComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  readonly profileService = inject(ProfileService);
  private readonly themeService = inject(ThemeService);

  /** "Cerrar sesión" (lo maneja el layout). */
  readonly logout = output<void>();

  readonly tab = signal<Tab>('profile');
  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Perfil' },
    { id: 'appearance', label: 'Apariencia' },
    { id: 'layout', label: 'Acomodo' },
  ];

  readonly profile = this.profileService.profile;
  readonly accents = this.themeService.accents;
  readonly theme = this.themeService.theme;
  readonly accent = this.themeService.accent;
  readonly accentApplies = computed(() => usesAccent(this.theme()));

  /** Temas agrupados (Básicos / Frutiger Aero). */
  readonly themeGroups = THEME_GROUPS.map((g) => ({
    ...g,
    themes: this.themeService.themes.filter((t) => t.group === g.id),
  }));

  /** Emojis sugeridos para el avatar. */
  readonly emojis = ['😊', '😎', '🦊', '🐱', '🐶', '🐼', '🦄', '🌸', '🌻', '⭐', '🚀', '🎧', '🐠', '🫧'];

  readonly startSections: { id: StartSection; label: string }[] = [
    { id: 'tasks', label: 'Pendientes' },
    { id: 'streaks', label: 'Rachas' },
    { id: 'calendar', label: 'Calendario' },
    { id: 'clock', label: 'Reloj' },
  ];

  /** Texto del campo de nombre (se guarda al terminar de escribir). */
  readonly name = signal(this.profile().displayName);

  saveName(): void {
    const value = this.name().trim();
    if (value !== this.profile().displayName) this.profileService.update({ displayName: value });
  }

  setEmoji(emoji: string): void {
    this.profileService.update({ avatarEmoji: emoji });
  }

  setAccent(id: AccentId): void {
    this.profileService.update({ accent: id });
  }

  setTheme(id: ThemeId): void {
    this.profileService.update({ theme: id });
  }

  setStart(id: StartSection): void {
    this.profileService.update({ startSection: id });
  }

  setGreeting(show: boolean): void {
    this.profileService.update({ showGreeting: show });
  }
}
