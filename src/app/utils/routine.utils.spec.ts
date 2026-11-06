import { Routine } from '../models/routine.model';
import { doneKey, frequencyLabel, isDoneOn, isDueOn, nextDueDate, routineTimes } from './routine.utils';

/** Noviembre 2026: L 2 · M 3 · X 4 · J 5 · V 6 · S 7 · D 8. */
function routine(partial: Partial<Routine>): Routine {
  return {
    id: 'r1',
    title: 'Medicina',
    frequency: 'daily',
    startDate: '2026-11-01',
    remind: false,
    doneDates: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...partial,
  };
}

describe('isDueOn', () => {
  it('todos los días, desde su fecha de inicio', () => {
    const r = routine({ startDate: '2026-11-03' });
    expect(isDueOn(r, '2026-11-02')).toBe(false);
    expect(isDueOn(r, '2026-11-03')).toBe(true);
    expect(isDueOn(r, '2026-11-20')).toBe(true);
  });

  it('solo los días de la semana elegidos', () => {
    const r = routine({ frequency: 'weekdays', days: [1, 3] }); // lunes y miércoles
    expect(isDueOn(r, '2026-11-02')).toBe(true); // lunes
    expect(isDueOn(r, '2026-11-03')).toBe(false); // martes
    expect(isDueOn(r, '2026-11-04')).toBe(true); // miércoles
  });

  it('cada N días contando desde el inicio', () => {
    const r = routine({ frequency: 'interval', everyDays: 3, startDate: '2026-11-04' });
    expect(isDueOn(r, '2026-11-04')).toBe(true);
    expect(isDueOn(r, '2026-11-05')).toBe(false);
    expect(isDueOn(r, '2026-11-07')).toBe(true);
    expect(isDueOn(r, '2026-11-10')).toBe(true);
  });

  it('"cada N días" no se descuadra con el cambio de mes', () => {
    const r = routine({ frequency: 'interval', everyDays: 7, startDate: '2026-10-29' });
    expect(isDueOn(r, '2026-11-05')).toBe(true);
    expect(isDueOn(r, '2026-11-12')).toBe(true);
  });
});

describe('isDoneOn (por horario)', () => {
  it('marca cada horario por separado', () => {
    const r = routine({ times: ['08:00', '21:00'], doneDates: [doneKey('2026-11-05', '08:00')] });
    expect(isDoneOn(r, '2026-11-05', '08:00')).toBe(true);
    expect(isDoneOn(r, '2026-11-05', '21:00')).toBe(false);
  });

  it('una marca vieja del día completo cuenta para todos sus horarios', () => {
    const r = routine({ times: ['08:00', '21:00'], doneDates: ['2026-11-05'] });
    expect(isDoneOn(r, '2026-11-05', '21:00')).toBe(true);
  });
});

describe('routineTimes', () => {
  it('lee el formato nuevo (times) y el viejo (time)', () => {
    expect(routineTimes(routine({ times: ['09:00'] }))).toEqual(['09:00']);
    expect(routineTimes(routine({ time: '10:30' }))).toEqual(['10:30']);
    expect(routineTimes(routine({}))).toEqual([]);
  });
});

describe('frequencyLabel / nextDueDate', () => {
  it('describe la frecuencia en palabras', () => {
    expect(frequencyLabel(routine({}))).toBe('Todos los días');
    expect(frequencyLabel(routine({ frequency: 'weekdays', days: [5, 1, 3] }))).toBe('L, X, V');
    expect(frequencyLabel(routine({ frequency: 'interval', everyDays: 3 }))).toBe('Cada 3 días');
  });

  it('encuentra el siguiente día que toca', () => {
    const r = routine({ frequency: 'weekdays', days: [1] }); // solo lunes
    expect(nextDueDate(r, '2026-11-05')).toBe('2026-11-09');
  });
});
