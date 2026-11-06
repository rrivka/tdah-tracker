import { Component, inject, input } from '@angular/core';
import { ProfileService } from '../../services/profile.service';

/**
 * Avatar del usuario: emoji elegido, foto de Google o inicial del nombre.
 * Uso: <app-avatar />  o  <app-avatar size="lg" />
 */
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  host: {
    class: 'avatar',
    '[class.avatar--lg]': 'size() === "lg"',
  },
})
export class AvatarComponent {
  readonly size = input<'sm' | 'lg'>('sm');
  readonly avatar = inject(ProfileService).avatar;
}
