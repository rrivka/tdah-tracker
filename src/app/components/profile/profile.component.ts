import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { ThemeService } from '../../services/theme.service';
import { StartSection } from '../../models/profile.model';
import { AccentId, ThemeId } from '../../themes';
import { AvatarComponent } from '../avatar/avatar.component';

/**
 * "Mi perfil": nombre, avatar, color, tema, pantalla de inicio y cuenta.
 * Cada cambio se guarda al momento (no hay botón "Guardar"), salvo el nombre,
 * que se guarda al salir del campo o al presionar Enter.
 */
@Component({
  selector: 'app-profile',
  imports: [FormsModule, AvatarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  readonly profileService = inject(ProfileService);
  private readonly themeService = inject(ThemeService);

  /** "Cerrar sesión" (lo maneja el layout). */
  readonly logout = output<void>();

  readonly profile = this.profileService.profile;
  readonly themes = this.themeService.themes;
  readonly accents = this.themeService.accents;
  readonly theme = this.themeService.theme;
  readonly accent = this.themeService.accent;

  /** Emojis sugeridos para el avatar. */
  readonly emojis = ['😊', '😎', '🦊', '🐱', '🐶', '🐼', '🦄', '🌸', '🌻', '⭐', '🚀', '🎧'];

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
