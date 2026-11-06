import { Component, computed, inject, signal } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { CARDS, CardId, DEFAULT_LAYOUT, DashboardLayout, SECTION_LABELS, Section, cardInfo } from '../../cards';

type Column = 'left' | 'right';

/**
 * Acomodo: cuadrícula de prueba para ordenar las tarjetas del tablero.
 *
 * - Arrastrar: toma una tarjeta por su asa ⠿ y suéltala donde quieras (mouse o dedo).
 *   Se usan eventos de puntero (pointer events), que funcionan igual con mouse y touch.
 * - Botones: ↑ ↓ (subir/bajar), ⇄ (cambiar de columna), 👁 (mostrar/ocultar).
 * - Nada cambia en el tablero hasta presionar "Guardar acomodo".
 */
@Component({
  selector: 'app-layout-editor',
  templateUrl: './layout-editor.component.html',
  styleUrl: './layout-editor.component.scss',
})
export class LayoutEditorComponent {
  private readonly profile = inject(ProfileService);

  /** Borrador: lo que se ve en la cuadrícula de prueba. */
  readonly draft = signal<DashboardLayout>(copy(this.profile.profile().layout));
  /** ¿Hay cambios sin guardar? */
  readonly dirty = computed(() => JSON.stringify(this.draft()) !== JSON.stringify(this.profile.profile().layout));
  readonly saved = signal(false);

  readonly columns: { id: Column; label: string }[] = [
    { id: 'left', label: 'Columna angosta' },
    { id: 'right', label: 'Columna ancha' },
  ];

  // ---- Arrastre ----
  /** Tarjeta que se está arrastrando. */
  readonly dragging = signal<CardId | null>(null);
  /** Dónde caería si la sueltas ahora. */
  readonly dropTarget = signal<{ col: Column; index: number } | null>(null);
  /** Posición del puntero (para dibujar la "fantasma" que sigue al dedo/mouse). */
  readonly pointer = signal<{ x: number; y: number } | null>(null);

  /** Orden de las pestañas en el teléfono con este acomodo. */
  readonly phoneTabs = computed(() => {
    const d = this.draft();
    const sections: Section[] = [];
    for (const id of [...d.left, ...d.right]) {
      if (d.hidden.includes(id)) continue;
      const s = cardInfo(id).section;
      if (!sections.includes(s)) sections.push(s);
    }
    return [...sections, 'settings' as Section].map((s) => SECTION_LABELS[s]);
  });

  info = cardInfo;

  isHidden(id: CardId): boolean {
    return this.draft().hidden.includes(id);
  }

  // ---- Arrastre con el asa ⠿ ----

  startDrag(event: PointerEvent, id: CardId): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging.set(id);
    this.pointer.set({ x: event.clientX, y: event.clientY });
    this.dropTarget.set(this.targetAt(event.clientX, event.clientY));
  }

  moveDrag(event: PointerEvent): void {
    if (!this.dragging()) return;
    this.pointer.set({ x: event.clientX, y: event.clientY });
    this.dropTarget.set(this.targetAt(event.clientX, event.clientY));
  }

  endDrag(): void {
    const id = this.dragging();
    const target = this.dropTarget();
    if (id && target) this.moveTo(id, target.col, target.index);
    this.dragging.set(null);
    this.dropTarget.set(null);
    this.pointer.set(null);
  }

  /**
   * Busca la columna bajo el puntero y en qué posición caería:
   * antes de la primera tarjeta cuya mitad esté debajo del puntero.
   */
  private targetAt(x: number, y: number): { col: Column; index: number } | null {
    const colEl = document.elementsFromPoint(x, y).find((el) => el instanceof HTMLElement && el.dataset['col']) as
      | HTMLElement
      | undefined;
    if (!colEl) return null;
    const tiles = Array.from(colEl.querySelectorAll<HTMLElement>('[data-card]')).filter(
      (t) => t.dataset['card'] !== this.dragging(),
    );
    let index = tiles.findIndex((t) => {
      const r = t.getBoundingClientRect();
      return y < r.top + r.height / 2;
    });
    if (index === -1) index = tiles.length;
    return { col: colEl.dataset['col'] as Column, index };
  }

  /** Índice donde dibujar la línea de "soltar aquí" dentro de una columna (o -1). */
  dropIndex(col: Column): number {
    const t = this.dropTarget();
    return t && t.col === col ? t.index : -1;
  }

  /** Tarjetas de una columna sin la que se está arrastrando (para dibujar la línea en su lugar). */
  visibleTiles(col: Column): CardId[] {
    return this.draft()[col];
  }

  // ---- Botones ----

  /** Mueve una tarjeta a una columna y posición (la posición cuenta sin la propia tarjeta). */
  moveTo(id: CardId, col: Column, index: number): void {
    this.draft.update((d) => {
      const left = d.left.filter((c) => c !== id);
      const right = d.right.filter((c) => c !== id);
      const target = col === 'left' ? left : right;
      target.splice(Math.max(0, Math.min(index, target.length)), 0, id);
      return { ...d, left, right };
    });
    this.saved.set(false);
  }

  moveBy(id: CardId, delta: number): void {
    const col = this.columnOf(id);
    const index = this.draft()[col].indexOf(id) + delta;
    if (index < 0 || index >= this.draft()[col].length) return;
    this.moveTo(id, col, index);
  }

  switchColumn(id: CardId): void {
    const other: Column = this.columnOf(id) === 'left' ? 'right' : 'left';
    this.moveTo(id, other, this.draft()[other].length);
  }

  toggleHidden(id: CardId): void {
    this.draft.update((d) => {
      if (d.hidden.includes(id)) return { ...d, hidden: d.hidden.filter((h) => h !== id) };
      // Siempre debe quedar al menos una tarjeta visible.
      if (d.hidden.length >= CARDS.length - 1) return d;
      return { ...d, hidden: [...d.hidden, id] };
    });
    this.saved.set(false);
  }

  canHide(id: CardId): boolean {
    return this.isHidden(id) || this.draft().hidden.length < CARDS.length - 1;
  }

  isFirst(id: CardId): boolean {
    return this.draft()[this.columnOf(id)].indexOf(id) === 0;
  }

  isLast(id: CardId): boolean {
    const list = this.draft()[this.columnOf(id)];
    return list.indexOf(id) === list.length - 1;
  }

  // ---- Guardar / descartar / restablecer ----

  save(): void {
    this.profile.update({ layout: copy(this.draft()) });
    this.saved.set(true);
  }

  discard(): void {
    this.draft.set(copy(this.profile.profile().layout));
    this.saved.set(false);
  }

  reset(): void {
    this.draft.set(copy(DEFAULT_LAYOUT));
    this.saved.set(false);
  }

  private columnOf(id: CardId): Column {
    return this.draft().left.includes(id) ? 'left' : 'right';
  }
}

function copy(l: DashboardLayout): DashboardLayout {
  return { left: [...l.left], right: [...l.right], hidden: [...l.hidden] };
}
