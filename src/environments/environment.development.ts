/**
 * Configuración del entorno.
 *
 * `firebase` es la configuración PÚBLICA del cliente web de Firebase
 * (obtenida con `firebase apps:sdkconfig`). No es un secreto: lo que
 * protege tus datos son las reglas de Firestore (firestore.rules).
 */
export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyDztzGjNzgEUBkShfgdTTl8_w3pkj6wApU',
    authDomain: 'tdah-tracker-rrivka.firebaseapp.com',
    projectId: 'tdah-tracker-rrivka',
    storageBucket: 'tdah-tracker-rrivka.firebasestorage.app',
    messagingSenderId: '944897198792',
    appId: '1:944897198792:web:0b175b19a280c3509df3fd',
  },
};
