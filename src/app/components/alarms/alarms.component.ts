import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlarmService } from '../../services/alarm.service';
import { TickService } from '../../services/tick.service';
import { Alarm } from '../../models/alarm.model';
import { formatTimeUntil } from '../../utils/time.utils';
import { UndoService } from '../../services/undo.service';


/** Lista de alarmas: crear, activar/desactivar y eliminar. */
@Component({
  selector: 'app-alarms',
  imports: [FormsModule],
  templateUrl: './alarms.component.html',
  styleUrl: './alarms.component.scss',
})
export class AlarmsComponent {
  private readonly alarmService = inject(AlarmService);
  private readonly undo = inject(UndoService);
  private readonly tick = inject(TickService);

  readonly alarms = this.alarmService.alarms;

  readonly time = signal('');
  readonly label = signal('');
  readonly repeat = signal(false);

  add(): void {
    if (!this.time()) return;
    this.alarmService.add(this.time(), this.label(), this.repeat());
    this.time.set('');
    this.label.set('');
    this.repeat.set(false);
  }

  toggle(id: string): void {
    this.alarmService.toggle(id);
  }

  remove(alarm: Alarm): void {
    // Borra al instante y ofrece "Deshacer".
    this.alarmService.remove(alarm.id);
    this.undo.show(`Se eliminó la alarma de las ${alarm.time}`, () => this.alarmService.restore(alarm));
  }

  /** "en 2 h 15 min" (se actualiza solo porque lee tick.now()). */
  timeUntil(alarm: Alarm): string {
    return formatTimeUntil(this.alarmService.msUntil(alarm, this.tick.now()));
  }
}
