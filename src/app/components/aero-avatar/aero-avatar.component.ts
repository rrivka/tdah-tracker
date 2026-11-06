import { Component, computed, input } from '@angular/core';
import { AeroAvatar } from '../../aero-avatars';

/** Contador para que cada avatar tenga ids de degradado únicos en la página. */
let nextId = 0;

/**
 * Dibujo SVG de un avatar Frutiger Aero (figura de gel brillante).
 * Capas: relleno con degradado radial, luz interna abajo, reflejos blancos arriba
 * y contorno del tono profundo. Accesorios: cono o antenas. Forma "cat": michi de gelatina.
 *
 * Uso: <app-aero-avatar [avatar]="a" />  (ocupa el tamaño de su contenedor)
 */
@Component({
  selector: 'app-aero-avatar',
  templateUrl: './aero-avatar.component.html',
  styles: [':host { display: block; width: 100%; height: 100%; } svg { display: block; width: 100%; height: 100%; }'],
})
export class AeroAvatarComponent {
  readonly avatar = input.required<AeroAvatar>();

  /** Prefijo único para los ids de los degradados de este dibujo. */
  readonly uid = `aero-av-${nextId++}`;

  /** El cono sobresale por arriba: se amplía el área visible. */
  readonly viewBox = computed(() => (this.avatar().accessory === 'cone' ? '0 -22 100 122' : '0 0 100 100'));

  url(name: string): string {
    return `url(#${this.uid}-${name})`;
  }
}
