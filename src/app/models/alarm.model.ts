/**
 * Una alarma.
 * Se guarda solo en este dispositivo (localStorage), no en Firestore: así no suena
 * en todos tus dispositivos a la vez.
 */
export interface Alarm {
  id: string;
  /** Hora "HH:MM" (24 h). */
  time: string;
  label: string;
  enabled: boolean;
  /** true = suena todos los días; false = una sola vez (se apaga sola al sonar). */
  repeat: boolean;
  /** Si el aviso viene de una actividad constante, su id (para el botón "Ya lo hice"). */
  routineId?: string;
}
