import { fromDateKey, toDateKey } from './date.utils';
import { formatDuration, formatTimeUntil, toTimeKey } from './time.utils';

describe('fechas (date.utils)', () => {
  it('convierte un Date a "YYYY-MM-DD" con ceros a la izquierda', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('ida y vuelta sin perder el día', () => {
    expect(toDateKey(fromDateKey('2026-11-30'))).toBe('2026-11-30');
  });

  it('las claves se pueden comparar como texto', () => {
    expect('2026-11-05' < '2026-11-10').toBe(true);
    expect('2026-09-30' < '2026-10-01').toBe(true);
  });
});

describe('horas y duraciones (time.utils)', () => {
  it('formatea duraciones como MM:SS o H:MM:SS', () => {
    expect(formatDuration(65_000)).toBe('01:05');
    expect(formatDuration(3_661_000)).toBe('1:01:01');
    expect(formatDuration(-5)).toBe('00:00');
  });

  it('redondea hacia arriba los segundos (no muestra 00:00 antes de tiempo)', () => {
    expect(formatDuration(500)).toBe('00:01');
  });

  it('"HH:MM" de una fecha', () => {
    expect(toTimeKey(new Date(2026, 10, 5, 7, 4))).toBe('07:04');
  });

  it('texto de cuánto falta', () => {
    expect(formatTimeUntil(5 * 60_000)).toBe('en 5 min');
    expect(formatTimeUntil(2 * 3_600_000)).toBe('en 2 h');
    expect(formatTimeUntil(2 * 3_600_000 + 15 * 60_000)).toBe('en 2 h 15 min');
  });
});
