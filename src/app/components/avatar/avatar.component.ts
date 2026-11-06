import { Component, computed, inject, input } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { AeroAvatarComponent } from '../aero-avatar/aero-avatar.component';
import { findAeroAvatar } from '../../aero-avatars';

/**
 * Avatar del usuario: avatar Frutiger Aero, emoji elegido, foto de Google o inicial del nombre.
 * Uso: <app-avatar />  o  <app-avatar size="lg" />
 */
@Component({
  selector: 'app-avatar',
  imports: [AeroAvatarComponent],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  host: {
    class: 'avatar',
    '[class.avatar--lg]': 'size() === "lg"',
    '[class.avatar--aero]': 'avatar().kind === "aero"',
  },
})
export class AvatarComponent {
  readonly size = input<'sm' | 'lg'>('sm');
  readonly avatar = inject(ProfileService).avatar;
  /** Datos del avatar Aero (si es de ese tipo). */
  readonly aero = computed(() => {
    const a = this.avatar();
    return a.kind === 'aero' ? findAeroAvatar(a.value) : undefined;
  });
}
