import { Injectable, signal } from '@angular/core';

/**
 * TickService: un "latido" cada 250 ms con la hora actual (`now`, en milisegundos).
 *
 * Lo usan el temporizador y las alarmas. Corre dentro de un Web Worker porque los
 * navegadores frenan mucho los setInterval normales cuando la pestaña está en segundo
 * plano (hasta 1 vez por minuto); los workers no sufren ese freno tan fuerte.
 */
@Injectable({ providedIn: 'root' })
export class TickService {
  readonly now = signal(Date.now());

  constructor() {
    const tick = () => this.now.set(Date.now());
    try {
      const code = 'setInterval(() => postMessage(0), 250);';
      const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
      const worker = new Worker(url);
      worker.onmessage = tick;
    } catch {
      // Si el navegador no permite workers, usamos un intervalo normal.
      setInterval(tick, 250);
    }
  }
}
