# TDAH Tracker

PWA personal para organizar pendientes: reloj, temporizador (con ventana flotante), alarmas, calendario mensual
y lista de pendientes con fecha opcional. Inicio de sesión con Google; los pendientes se guardan en Firestore y
funcionan sin internet.

## Personalización (varias personas)

Cada persona entra con **su propia cuenta de Google** y solo ve sus datos (reglas de Firestore).
"Personalización" se abre tocando el avatar del encabezado (o Ajustes → Abrir personalización) y tiene 3 pestañas:

- **Perfil:** nombre para mostrar (apodo), avatar (foto de Google o emoji), pantalla de inicio en el teléfono,
  saludo en el reloj y Cerrar sesión.
- **Apariencia:** temas **Básicos** (Claro/Oscuro + color de acento) y **Frutiger Aero** (Cielo, Agua, Eco, Sakura,
  Lila, Pecera, Noche). Cada tema tiene una vista previa en miniatura.
- **Acomodo:** cuadrícula de prueba con las 5 tarjetas (Reloj, Calendario, Rachas, Constantes, Pendientes) en dos
  columnas. Se arrastran por su asa ⠿ (mouse o dedo, con *pointer events*) o con los botones ↑ ↓ ⇄ 👁 (ocultar).
  Nada cambia hasta "Guardar acomodo". En el teléfono, el orden de las pestañas sigue el acomodo.
  Código: `src/app/cards.ts` (lista de tarjetas y acomodo por defecto) y `components/layout-editor/`.

### Cómo funcionan los temas

- Todas las tarjetas usan las clases globales `.card` y `.card-title` (`src/styles.scss`).
- Además de los colores hay **tokens de estructura** en `_tokens.scss` (`--bg-page`, `--bg-card`, `--card-backdrop`,
  `--bg-card-title`, `--bg-button`, `--bg-button-primary`, `--button-radius`, `--font-family-heading`…). Un tema
  sencillo no los toca; Frutiger Aero los cambia por degradados, vidrio y brillos.
- **Nueva variante Aero:** copia un bloque `[data-theme="aero-sky"]` (solo trae la paleta `--aero-*`), cámbiale
  nombre y colores, y agrégalo a `THEMES` en `src/app/themes.ts` con `group: 'aero'`.
- Las fuentes de Aero (Nunito y Fredoka) se cargan desde Google Fonts en `src/index.html`.

Se guarda en Firestore (`users/{uid}/profile/main`, `services/profile.service.ts`) y se sincroniza entre dispositivos.
Las **alarmas** se guardan en el dispositivo pero **separadas por usuario**, así no suenan en la sesión de otra persona.

**Agregar un color de acento:** en `_tokens.scss` copia un par de bloques `[data-accent='...']` (claro) y
`[data-theme='dark'][data-accent='...']` (oscuro), y agrégalo a `ACCENTS` en `src/app/themes.ts`.

## Los tres tipos de cosas

Todo se crea con el botón **+** (ventana "Agregar", `components/create-dialog/`), que tiene tres pestañas:

| Tipo | Para qué | Dónde se guarda |
|---|---|---|
| **Pendiente** | Algo corto que se hace una vez | `users/{uid}/tasks` |
| **Constante** | Algo corto que se repite (medicación) | `users/{uid}/routines` |
| **Racha** | Un hábito más grande que quieres sostener día a día (ejercicio, agua) | `users/{uid}/streaks` |

## Rachas (estilo Duolingo)

- **Tarjetas** con emoji, 🔥 días seguidos, los últimos 7 días y botón **"¡Hecho hoy!"** (muestra un festejo).
- **Tocar la tarjeta** abre el detalle: racha actual, mejor racha, total y un **calendario** con días cumplidos,
  fallados, de descanso y en pausa. Se pueden marcar días pasados que olvidaste registrar.
- **Días de la racha:** p. ej. solo L, X, V. Los demás son de descanso y **no rompen** la racha.
- **Pausar / reanudar:** los días en pausa tampoco la rompen (vacaciones, enfermedad).
- Cálculos en `utils/streak.utils.ts`; datos en `services/streak.service.ts`; vista en `components/streak-board/`,
  `streak-calendar/` y `streak-form/`. Colores: `--color-streak` y `--color-streak-soft`.
- En el teléfono tienen su propia pestaña "Rachas"; en escritorio van arriba de los pendientes.

## Actividades constantes

Cosas cortas que se repiten (medicación…), separadas de los pendientes sueltos.

- Se crean con el mismo botón **+** → pestaña "Constante".
- **Frecuencia:** todos los días, algunos días de la semana o cada N días (desde una fecha).
- **Horarios opcionales (uno o varios**, p. ej. 08:00 y 21:00). Cada horario es una fila con su propia casilla.
  Con "Avisarme" suena en cada horario como alarma (con botón
  "Ya lo hice") si aún no está marcada. Solo con la app abierta, igual que las alarmas.
- El apartado muestra las de **hoy** con casilla de "hecho" (se reinicia cada día) y "Ver todas" para editar/eliminar.
- Se guardan en Firestore (`users/{uid}/routines/{id}`) y se incluyen en el respaldo JSON.
- Código: `services/routine.service.ts`, `utils/routine.utils.ts` (cálculo de "¿toca hoy?"),
  `components/routine-list/` y `components/routine-form/`. Color distintivo: `--color-routine` en los tokens.

## Temporizador, alarmas y accesos directos

- **Cómo se abren:** el temporizador y las alarmas están en una ventana modal que se abre **tocando la hora** del
  reloj (o el indicador ⏱ del encabezado). Crear un pendiente también es una ventana modal: botón **+** debajo de la
  lista. Ambas usan el componente reutilizable `components/modal/`.
- **Mantener la sesión iniciada:** casilla en el login. Si se desmarca, la sesión se borra al cerrar el navegador
  (`setRemember()` en `services/auth.service.ts`).
- **Temporizador**: atajos (cambia la lista `presets` en `components/timer/timer.component.ts`),
  pausa, +1 min. Su estado vive en `services/timer.service.ts` y sobrevive a recargas.
- **Ventana flotante** (solo escritorio): usa la API *Document Picture-in-Picture* (Chrome, Edge, Opera), que abre una
  mini ventana encima de todos los programas. En otros navegadores se muestra como recuadro dentro de la app
  (`components/floating-timer/`).
- **Alarmas** (Reloj → Alarmas): diarias o de una vez, con "Posponer 5 min". Se guardan **solo en este dispositivo**
  (localStorage) para que no suenen en todos a la vez (`services/alarm.service.ts`).
- **Límite de la web:** el temporizador y las alarmas solo suenan **con la app abierta** (puede estar minimizada o en
  otra pestaña). Una PWA no puede despertar al teléfono con la app cerrada.
- **Notificaciones:** se activan en Ajustes → Notificaciones. En iPhone solo funcionan con la app instalada en la
  pantalla de inicio (iOS 16.4+).
- **Accesos directos del ícono** (mantén presionado el ícono de la app instalada, Android/escritorio): "Nuevo
  pendiente", "Temporizador" y "Alarmas". Se definen en `shortcuts` de `public/manifest.webmanifest`.
  iPhone no los soporta.

- **App publicada:** https://rrivka.github.io/tdah-tracker/
- **Stack:** Angular 21 (standalone + signals, zoneless) · @angular/pwa · Firebase (Auth + Firestore) con @angular/fire · SCSS sin librerías de UI.

> Por qué Angular 21 y no 22: la versión estable de `@angular/fire` (21.0.0) solo es compatible con Angular 21.
> Cuando salga `@angular/fire` 22 estable se puede actualizar con `ng update @angular/core@22 @angular/cli@22 @angular/fire@22`.

---

## Correr en local

Requisitos: Node.js 22 o 24 (LTS) y npm.

```bash
npm install
npm start          # = ng serve → http://localhost:4200
```

`localhost` ya está autorizado en Firebase Authentication, así que el login con Google funciona en local.

## Probar la PWA (service worker)

El service worker **solo funciona con el build de producción**, no con `ng serve`. Para probarlo:

```bash
npm run build                                   # genera dist/tdah-tracker/browser
npx http-server dist/tdah-tracker/browser -p 8080 -c-1
```

Abre http://localhost:8080 → DevTools → pestaña **Application**:
- **Service workers**: debe aparecer `ngsw-worker.js` activo.
- **Manifest**: nombre, iconos y botón de instalar.
- Marca **Offline** en la pestaña Network y recarga: la app sigue cargando, y los pendientes que crees se sincronizan al volver a tener conexión.

## Desplegar

Es automático: cada `git push` a `main` ejecuta el GitHub Action [.github/workflows/deploy.yml](.github/workflows/deploy.yml), que compila con
`--base-href /tdah-tracker/` y publica en GitHub Pages. Puedes ver el progreso en la pestaña **Actions** del repo o con:

```bash
gh run watch
```

Las reglas de seguridad de Firestore se despliegan aparte (solo si cambias `firestore.rules`):

```bash
firebase deploy --only firestore:rules
```

---

## Estructura

```
src/
├── styles/
│   ├── _tokens.scss        ← TODOS los colores, fuentes, tamaños, espacios, bordes, radios y sombras + temas
│   └── _breakpoints.scss   ← ancho a partir del cual se usa la vista de escritorio
├── styles.scss             ← estilos base de elementos HTML (body, button, input…)
├── environments/           ← configuración pública de Firebase
└── app/
    ├── app.config.ts       ← Firebase, router (hash), service worker, persistencia offline
    ├── app.routes.ts       ← rutas: /login y / (protegida con authGuard)
    ├── app.constants.ts    ← nombre de la app (APP_NAME)
    ├── themes.ts           ← lista de temas que aparecen en Ajustes
    ├── models/task.model.ts
    ├── utils/date.utils.ts
    ├── guards/auth.guard.ts
    ├── services/
    │   ├── auth.service.ts      ← login/logout con Google, usuario como signal
    │   ├── storage.service.ts   ← ÚNICA capa que habla con Firestore
    │   ├── task.service.ts      ← lógica de pendientes (signals, filtros, exportar/importar)
    │   └── theme.service.ts     ← cambia y recuerda el tema
    └── components/
        ├── login/  layout/  clock/  calendar/
        └── task-list/  task-form/  settings/
```

Los datos viven en Firestore en `users/{uid}/tasks/{taskId}`. Las reglas ([firestore.rules](firestore.rules)) permiten
que cada usuario lea y escriba **solo** sus propios pendientes; todo lo demás está denegado.

---

## Personalizar estilos

**Regla de oro:** el SCSS de los componentes solo usa variables `var(--...)` de `src/styles/_tokens.scss`.
Para cambiar el aspecto de toda la app, cambia los valores de los tokens.

- **Colores de un tema:** edita su bloque en `_tokens.scss` (`:root, [data-theme='light']` o `[data-theme='dark']`).
- **Fuentes, tamaños, espacios, radios:** edita el bloque `:root` del principio de `_tokens.scss`.
  Si usas una fuente de Google Fonts, agrega su `<link>` en `src/index.html` y cambia `--font-family-base`.
- **Un componente concreto:** cada uno tiene su `.scss` y clases con formato `bloque__elemento--modificador`
  (por ejemplo `.task-item__title`, `.calendar__day--today`). Busca la clase en el `.html` y edítala en el `.scss`.
- **Vista de escritorio / teléfono:** el punto de quiebre está en `src/styles/_breakpoints.scss`; la distribución en
  `components/layout/layout.component.scss`.

### Agregar un tema nuevo

1. En `src/styles/_tokens.scss`, copia el bloque `[data-theme='dark'] { ... }`, cámbiale el nombre y los colores:
   ```scss
   [data-theme='sepia'] {
     color-scheme: light;
     --color-bg: #f4ecd8;
     --color-text: #3b2f1e;
     /* ...las mismas variables que los otros temas... */
   }
   ```
2. En `src/app/themes.ts`, agrégalo a la lista:
   ```ts
   { id: 'sepia', label: 'Sepia' },
   ```

Listo: aparece en **Ajustes** y no hay que tocar ningún componente.

### Cambiar el nombre de la app

- `src/app/app.constants.ts` → `APP_NAME`
- `public/manifest.webmanifest` → `name` y `short_name`
- `src/index.html` → `<title>`
- Iconos: reemplaza los PNG de `public/icons/` (mismos nombres y tamaños).

---

## Respaldo

En **Ajustes → Respaldo**:
- **Exportar JSON** descarga `pendientes-AAAA-MM-DD.json` con todos tus pendientes.
- **Importar JSON** lee un respaldo: los pendientes con el mismo `id` se actualizan y los nuevos se agregan. Nunca borra nada.
