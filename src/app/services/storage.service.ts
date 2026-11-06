import { Injectable, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  Unsubscribe,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { Task } from '../models/task.model';

/**
 * StorageService: la ÚNICA capa que habla con Firestore.
 * Ningún componente debe importar Firebase; todo pasa por aquí (a través de TaskService).
 *
 * Estructura de datos:  users/{uid}/tasks/{taskId}
 *
 * Nota sobre el modo sin conexión: con la persistencia offline activada,
 * las escrituras se aplican al instante en la caché local (y onSnapshot avisa),
 * pero la promesa no se resuelve hasta que el servidor confirma. Por eso
 * TaskService NO espera (await) estas promesas: así la app no se queda "colgada" sin internet.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly firestore = inject(Firestore);

  private tasksCollection(uid: string) {
    return collection(this.firestore, 'users', uid, 'tasks');
  }

  /** Genera un id nuevo para un pendiente (sin ir al servidor). */
  newTaskId(uid: string): string {
    return doc(this.tasksCollection(uid)).id;
  }

  /** Escucha en tiempo real todos los pendientes del usuario. Devuelve una función para dejar de escuchar. */
  watchTasks(uid: string, onChange: (tasks: Task[]) => void, onError: (e: Error) => void): Unsubscribe {
    return onSnapshot(
      this.tasksCollection(uid),
      (snapshot) => onChange(snapshot.docs.map((d) => ({ ...(d.data() as Omit<Task, 'id'>), id: d.id }))),
      onError,
    );
  }

  /** Crea o reemplaza un pendiente completo. */
  saveTask(uid: string, task: Task): Promise<void> {
    const { id, ...data } = task;
    return setDoc(doc(this.tasksCollection(uid), id), clean(data));
  }

  deleteTask(uid: string, id: string): Promise<void> {
    return deleteDoc(doc(this.tasksCollection(uid), id));
  }

  /** Guarda muchos pendientes a la vez (para importar). Firestore permite máx. 500 por lote. */
  saveMany(uid: string, tasks: Task[]): Promise<void> {
    const commits: Promise<void>[] = [];
    for (let i = 0; i < tasks.length; i += 450) {
      const batch = writeBatch(this.firestore);
      for (const { id, ...data } of tasks.slice(i, i + 450)) {
        batch.set(doc(this.tasksCollection(uid), id), clean(data));
      }
      commits.push(batch.commit());
    }
    return Promise.all(commits).then(() => undefined);
  }
}

/** Firestore no acepta `undefined`: quitamos esas propiedades. */
function clean<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}
