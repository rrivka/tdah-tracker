# TDAH Tracker

PWA personal para organizar pendientes: reloj, calendario mensual y lista de pendientes con fecha opcional.
Inicio de sesión con Google; los datos se guardan en Firestore y funcionan sin internet.

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
