import { Streak } from '../models/streak.model';
import { bestStreak, currentStreak, dayStatus, isScheduled, lastDays } from './streak.utils';

/**
 * Pruebas de las rachas. Calendario de referencia (noviembre 2026):
 *   L 2 · M 3 · X 4 · J 5 · V 6 · S 7 · D 8   (1 de nov = domingo)
 */
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const MON_WED_FRI = [1, 3, 5];

function streak(partial: Partial<Streak>): Streak {
  return {
    id: 's1',
    title: 'Ejercicio',
    emoji: '💪',
    days: ALL_DAYS,
    active: true,
    pauses: [],
    startDate: '2026-11-01',
    doneDates: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...partial,
  };
}

describe('currentStreak', () => {
  it('cuenta los días cumplidos seguidos hasta hoy', () => {
    const s = streak({ doneDates: ['2026-11-03', '2026-11-04', '2026-11-05'] });
    expect(currentStreak(s, '2026-11-05')).toBe(3);
  });

  it('si hoy toca y aún no se hace, no rompe la racha (todavía hay tiempo)', () => {
    const s = streak({ doneDates: ['2026-11-03', '2026-11-04'] });
    expect(currentStreak(s, '2026-11-05')).toBe(2);
  });

  it('un día que tocaba y no se hizo rompe la racha', () => {
    // 3 y 4 hechos, 5 fallado, hoy es 6 y no está hecho
    const s = streak({ doneDates: ['2026-11-03', '2026-11-04'] });
    expect(currentStreak(s, '2026-11-06')).toBe(0);
  });

  it('los días de descanso no rompen la racha', () => {
    // Solo L, X, V: hechos lunes 2 y miércoles 4; hoy jueves 5 (descanso)
    const s = streak({ days: MON_WED_FRI, doneDates: ['2026-11-02', '2026-11-04'] });
    expect(currentStreak(s, '2026-11-05')).toBe(2);
  });

  it('hacerlo en un día de descanso cuenta como extra', () => {
    const s = streak({ days: MON_WED_FRI, doneDates: ['2026-11-02', '2026-11-04', '2026-11-05'] });
    expect(currentStreak(s, '2026-11-05')).toBe(3);
  });

  it('los días en pausa no rompen la racha', () => {
    const s = streak({
      doneDates: ['2026-11-01', '2026-11-02'],
      pauses: [{ from: '2026-11-03', to: '2026-11-04' }],
    });
    expect(currentStreak(s, '2026-11-05')).toBe(2);
  });

  it('no cuenta días antes de que empiece la racha', () => {
    const s = streak({ startDate: '2026-11-04', doneDates: ['2026-11-04'] });
    expect(currentStreak(s, '2026-11-05')).toBe(1);
  });
});

describe('bestStreak', () => {
  it('encuentra la racha más larga de la historia', () => {
    // 1-3 seguidos (3), 4 fallado, 5-6 seguidos (2)
    const s = streak({ doneDates: ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06'] });
    expect(bestStreak(s, '2026-11-06')).toBe(3);
  });
});

describe('isScheduled / dayStatus', () => {
  const s = streak({
    days: MON_WED_FRI,
    startDate: '2026-11-02',
    doneDates: ['2026-11-02'],
    pauses: [{ from: '2026-11-06', to: '2026-11-06' }],
  });

  it('toca solo en sus días, desde su inicio y fuera de pausa', () => {
    expect(isScheduled(s, '2026-11-04')).toBe(true); // miércoles
    expect(isScheduled(s, '2026-11-03')).toBe(false); // martes (descanso)
    expect(isScheduled(s, '2026-11-06')).toBe(false); // viernes en pausa
  });

  it('da el estado correcto a cada día', () => {
    const today = '2026-11-05';
    expect(dayStatus(s, '2026-11-01', today)).toBe('before');
    expect(dayStatus(s, '2026-11-02', today)).toBe('done');
    expect(dayStatus(s, '2026-11-03', today)).toBe('rest');
    expect(dayStatus(s, '2026-11-04', today)).toBe('missed');
    expect(dayStatus(s, '2026-11-06', today)).toBe('future');
  });

  it('hoy que toca y no se ha hecho es "today"', () => {
    expect(dayStatus(s, '2026-11-04', '2026-11-04')).toBe('today');
  });
});

describe('lastDays', () => {
  it('devuelve 7 días terminando hoy', () => {
    const days = lastDays(streak({}), '2026-11-07');
    expect(days.length).toBe(7);
    expect(days[0].key).toBe('2026-11-01');
    expect(days[6].key).toBe('2026-11-07');
  });
});
