# Kanban IT Departament (HHRR)

> Tablero kanban operativo para equipos de IT · Operational kanban workspace for IT teams

Kanban IT Departament es un espacio de trabajo kanban ligero para la gestión diaria de equipos de IT: asignar trabajo, monitorear SLA, priorizar bloqueos y reportar la ejecución sin salir del tablero.

[Producción](https://nostradamesp.github.io/HHRR/) · React · Vite · Firebase · Tailwind CSS

---

## 🇪🇸 Español

### Descripción

Aplicación diseñada para un equipo interno de IT donde los managers necesitan responder rápido:

- ¿Qué está vencido?
- ¿Quién es dueño de cada tarea?
- ¿Qué trabajo está bloqueado?
- ¿Qué está listo para cerrar?
- ¿Qué sistemas generan más carga operativa?

### Características principales

- **Tablero Kanban:** tarjetas compactas, drag & drop, estados de columna, archivar, borrar y estados vacíos.
- **Detalle de tarea:** metadatos editables, asignación, SLA, fechas, checklist, comentarios, activity logs.
- **Vista Gantt:** timeline por fechas con edición rápida de fechas/SLA.
- **Lista de tareas:** vista de tabla operativa para revisión diaria.
- **Reportes:** métricas, resúmenes agrupados, tareas críticas, export CSV e impresión/PDF.
- **Sidebar de tablero:** cambio de boards, chat del board, gestión de miembros y filtros.
- **Login premium:** landing pública con modal de auth interactivo, signup y reset de contraseña (Firebase Auth).
- **Modo demo local:** usa `localStorage` en `localhost`/`127.0.0.1` para desarrollo sin tocar Firebase.

### Stack

- **Frontend:** React 18, Vite, Tailwind CSS · Iconos: lucide-react · Drag & drop: `@dnd-kit`
- **Auth y datos:** Firebase Auth + Cloud Firestore
- **Hosting:** GitHub Pages vía GitHub Actions
- **Tooling admin:** Firebase Admin SDK (scripts locales)

### Estructura

```txt
src/
  App.jsx             App principal: kanban, modal, Gantt, reportes, login
  AuthContext.jsx     Firebase Auth y perfil de usuario
  BoardContext.jsx    Membresía de board, board activo, CRUD
  Sidebar.jsx         Drawer lateral y controles de miembros
  ChatPanel.jsx       Chat del board
  firebase.js         Init de Firebase desde env vars de Vite
  branding.js         Nombre de la app y boards legacy
  styles.css          Entrada de Tailwind + CSS custom

firestore.rules       Reglas de seguridad Firestore
firebase.json         Config de reglas/hosting
scripts/              Tooling admin local
```

### Desarrollo local

```bash
npm install
npm run dev -- --host 0.0.0.0
# → http://localhost:5173/HHRR/
```

En local: `localhost` y `127.0.0.1` usan modo demo (localStorage); Firebase queda deshabilitado.

### Variables de entorno

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### Build y despliegue

```bash
npm run build
npm run preview
```

El CI/CD despliega a GitHub Pages en cada push a `main` (`.github/workflows/deploy.yml`). URL: `https://nostradamesp.github.io/HHRR/`

### Seguridad de Firestore

Datos scopeados por board (`boards/{boardId}`, tareas, comentarios, mensajes, logs, `users/{uid}`). Solo miembros leen datos del board; owners/admins/managers operan boards/tareas; el acceso global a `/tasks` está bloqueado.

```bash
firebase login
firebase deploy --only firestore:rules
```

### Modelo de datos operativo

Las tareas soportan campos opcionales de IT: `system`, `ticketType`, `impact`, `urgency`, `slaHours`, `startDate`, `dueDate`, `checklist`, `operationalState`, `blockedReason`, `commentsCount`.

### Notas de seguridad

- Nunca subir `service-account.json`.
- Config web de Firebase vía GitHub Secrets.
- Scripts admin solo desde una máquina de confianza.
- Adjuntos futuros en Firebase Storage, no en Firestore.

---

## 🇺🇸 English

### Overview

A lightweight IT operations board for daily management: kanban workflow, task details, checklist tracking, comments, Gantt planning and board-level reporting.

Built for small internal IT teams where managers need quick answers about overdue work, task ownership, blockers, closure readiness and systems creating operational load.

### Core features

- **Kanban board:** compact cards, drag and drop, column status, archive, delete mode and empty states.
- **Task detail modal:** editable metadata, assignment, SLA, start/due dates, checklist, comments, activity logs.
- **Gantt view:** timeline by task dates with quick date/SLA editing.
- **Task list:** operational table view for daily review.
- **Reports:** metrics, grouped summaries, critical tasks, CSV export and print/PDF.
- **Board sidebar:** board switching, board chat, member management and filters.
- **Premium login:** public landing with interactive auth modal, signup and password reset (Firebase Auth).
- **Local demo mode:** `localStorage` on `localhost`/`127.0.0.1` for development without touching Firebase.

### Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS · Icons: lucide-react · Drag & drop: `@dnd-kit`
- **Auth & data:** Firebase Auth + Cloud Firestore
- **Hosting:** GitHub Pages via GitHub Actions
- **Admin tooling:** Firebase Admin SDK (local scripts)

### Structure

```txt
src/
  App.jsx             Main app: kanban, modal, Gantt, reports, login
  AuthContext.jsx     Firebase Auth and user profile loading
  BoardContext.jsx    Board membership, active board, board CRUD
  Sidebar.jsx         Right-side board drawer and member controls
  ChatPanel.jsx       Board chat
  firebase.js         Firebase client initialization from Vite env vars
  branding.js         App name and legacy board display mapping
  styles.css          Tailwind entrypoint and custom app CSS

firestore.rules       Firestore security rules
firebase.json         Firebase rules/hosting config
scripts/              Local Firebase admin tooling
```

### Local development

```bash
npm install
npm run dev -- --host 0.0.0.0
# → http://localhost:5173/HHRR/
```

Locally, `localhost` and `127.0.0.1` use demo mode (localStorage); Firebase is disabled.

### Environment variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### Build & deployment

```bash
npm run build
npm run preview
```

CI/CD deploys to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`). URL: `https://nostradamesp.github.io/HHRR/`

### Firestore security

Data is scoped by board (`boards/{boardId}`, tasks, comments, messages, logs, `users/{uid}`). Only board members read data; owners/admins/managers operate boards/tasks; global `/tasks` access is blocked.

```bash
firebase login
firebase deploy --only firestore:rules
```

### Operational data model

Tasks support optional IT fields: `system`, `ticketType`, `impact`, `urgency`, `slaHours`, `startDate`, `dueDate`, `checklist`, `operationalState`, `blockedReason`, `commentsCount`.

### Security notes

- Never commit `service-account.json`.
- Keep Firebase web config in GitHub Secrets.
- Use local admin scripts only from a trusted machine.
- Store future attachments in Firebase Storage, not in Firestore.
