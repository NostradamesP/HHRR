# ARCHITECTURE — NoraHR / Kanban IT Department

> Documento de arquitectura (ES) / Architecture document (EN). Español e inglés con el mismo contenido.
> Este documento describe el **estado actual**, el **estado objetivo (Clean Architecture)** y el **roadmap de migración** P0–P3.

---

## 1. Estado Actual (ES) / Current State (EN)

### ES — Resumen

La aplicación es un **SPA en React 18 + Vite + Tailwind** con un modo dual de persistencia
(`localStorage` en `localhost`, Firebase Auth/Firestore en producción) y está desplegada en
GitHub Pages con base path `/HHRR/`.

Puntos principales:

- **`src/App.jsx` (~1600 líneas)** actúa como "god component": contiene el routing manual
  (kanban / modal / Gantt / reportes / login), el estado local de tareas, comentarios, adjuntos,
  y la lógica de operaciones sobre Firestore.
- **Dos contextos globales**: `AuthContext` (Firebase Auth + perfil `users/{uid}`) y
  `BoardContext` (boards en Firestore o localStorage).
- **Branching por entorno**: `firebase.js` decide si `auth/db/storage` son reales o `null`, y los
  contextos ramifican con `isLocalDemo`. Esto duplica flujos (Firestore vs localStorage).
- **Lógica de dominio dispersa**: `src/lib/utils.js` y `src/lib/kanban.js` contienen reglas de
  negocio (checklists, vencimiento, estado operativo, SLA, filtros) mezcladas con helpers de
  presentación (iconos, colores, sensores de dnd-kit).
- **Constantes duplicadas**: `src/constants/*` mezcla valores de dominio puro (statuses, phases,
  effort) con metadatos de UI (iconos lucide-react, clases Tailwind).
- **Archivos planos**: los componentes de presentación están en `src/components/**` sin jerarquía
  por capa.

### ES — Diagrama actual

```
UI (React) ──> App.jsx ──> Contexts (Auth/Board) ──> Firebase / localStorage
                 │                    │
                 └── lib/utils, lib/kanban, constants  (reglas de negocio + helpers UI mezclados)
```

### EN — Summary

The app is a **React 18 + Vite + Tailwind SPA** with dual persistence mode
(`localStorage` on `localhost`, Firebase Auth/Firestore in production), deployed to GitHub
Pages with base path `/HHRR/`.

Key points:

- **`src/App.jsx` (~1600 lines)** is a "god component": manual routing (kanban / modal / Gantt /
  reports / login), local state for tasks, comments, attachments, and Firestore operations.
- **Two global contexts**: `AuthContext` (Firebase Auth + `users/{uid}` profile) and
  `BoardContext` (boards in Firestore or localStorage).
- **Environment branching**: `firebase.js` decides whether `auth/db/storage` are real or `null`,
  and contexts branch with `isLocalDemo`, duplicating flows (Firestore vs localStorage).
- **Scattered domain logic**: `src/lib/utils.js` and `src/lib/kanban.js` mix business rules
  (checklists, overdue, operational state, SLA, filters) with presentation helpers (icons, colors,
  dnd-kit sensors).
- **Mixed constants**: `src/constants/*` mixes pure domain values (statuses, phases, effort) with
  UI metadata (lucide-react icons, Tailwind classes).
- **Flat files**: presentational components live in `src/components/**` with no layer hierarchy.

### EN — Current diagram

```
UI (React) ──> App.jsx ──> Contexts (Auth/Board) ──> Firebase / localStorage
                 │                    │
                 └── lib/utils, lib/kanban, constants  (business rules + UI helpers mixed)
```

---

## 2. Estado Objetivo (ES) / Target State (EN)

### ES — Principios

1. **Clean Architecture**: separar **dominio** (reglas de negocio) de **aplicación** (casos de
   uso), **infraestructura** (Firebase/localStorage) y **presentación** (React/Tailwind).
2. **Dependencias hacia adentro**: el dominio no conoce React, Firebase ni localStorage. La
   aplicación depende de **interfaces (ports)**; la infraestructura implementa esas interfaces
   (**adapters**).
3. **Inversión de dependencias**: los contextos de React consumen servicios de aplicación a través
   de **interfaces**, no Firestore directamente.
4. **Composición en la raíz**: `src/app/di.js` decide qué adapters inyectar según el entorno
   (`local` vs `firebase`), eliminando los branches `isLocalDemo` esparcidos.
5. **Migración incremental**: no se "reescribe" la app de golpe. Se crean las capas nuevas
   (`src/core`, `src/application`, `src/ports`, `src/infrastructure`) y se re-exportan desde los
   puntos de origen existentes hasta que la UI migre.

### ES — Diagrama objetivo

```
┌────────────────────────── PRESENTATION (React + Tailwind) ──────────────────────────┐
│  src/presentation/  views · components · ui · hooks · context (consumen services)  │
└──────────────────────────────────────────┬──────────────────────────────────────────┘
                                           │  inyecta casos de uso (ports)
┌────────────────────────── APPLICATION (casos de uso) ──────────────────────────────┐
│  src/application/  taskUseCases · boardUseCases · authUseCases · auditUseCases     │
│  depende SOLO de src/ports (interfaces), nunca de Firebase                          │
└──────────────────────────────────────────┬──────────────────────────────────────────┘
                                           │  implementa interfaces
┌────────────────────────── PORTS (interfaces) ──────────────────────────────────────┐
│  src/ports/  TaskRepository · BoardRepository · AuthProvider · AuditLogger         │
└──────────────────────────────────────────┬──────────────────────────────────────────┘
                                           │  adapters concretos
┌────────────────────────── INFRASTRUCTURE (adapters) ───────────────────────────────┐
│  src/infrastructure/  firebase/ (TaskRepository, BoardRepository, AuthProvider,    │
│                       AuditLogger)   local/ (misma interfaz sobre localStorage)    │
└──────────────────────────────────────────┬──────────────────────────────────────────┘
                                           │  usa el dominio
┌────────────────────────── DOMAIN (núcleo puro) ────────────────────────────────────┐
│  src/core/domain/  entities (Task, Board, User) · value-objects (Checklist, Date)  │
│                   services (taskService, filterService) · constants (statuses,     │
│                   phases, effort, itConfig, initialTasks)   — sin React/Firebase   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### EN — Principles

1. **Clean Architecture**: separate **domain** (business rules) from **application** (use cases),
   **infrastructure** (Firebase/localStorage) and **presentation** (React/Tailwind).
2. **Dependencies point inward**: the domain knows nothing about React, Firebase or localStorage.
   The application depends on **interfaces (ports)**; infrastructure implements them (**adapters**).
3. **Dependency inversion**: React contexts consume application services through **interfaces**,
   not Firestore directly.
4. **Composition at the root**: `src/app/di.js` decides which adapters to inject based on the
   environment (`local` vs `firebase`), removing scattered `isLocalDemo` branches.
5. **Incremental migration**: the app is not rewritten at once. New layers are created
   (`src/core`, `src/application`, `src/ports`, `src/infrastructure`) and re-exported from the
   existing origin points until the UI migrates.

### EN — Target diagram

```
┌────────────────────────── PRESENTATION (React + Tailwind) ──────────────────────────┐
│  src/presentation/  views · components · ui · hooks · context (consume services)   │
└──────────────────────────────────────────┬──────────────────────────────────────────┘
                                           │  injects use cases (ports)
┌────────────────────────── APPLICATION (use cases) ─────────────────────────────────┐
│  src/application/  taskUseCases · boardUseCases · authUseCases · auditUseCases     │
│  depends ONLY on src/ports (interfaces), never on Firebase                          │
└──────────────────────────────────────────┬──────────────────────────────────────────┘
                                           │  implements interfaces
┌────────────────────────── PORTS (interfaces) ──────────────────────────────────────┐
│  src/ports/  TaskRepository · BoardRepository · AuthProvider · AuditLogger         │
└──────────────────────────────────────────┬──────────────────────────────────────────┘
                                           │  concrete adapters
┌────────────────────────── INFRASTRUCTURE (adapters) ───────────────────────────────┐
│  src/infrastructure/  firebase/ (TaskRepository, BoardRepository, AuthProvider,    │
│                       AuditLogger)   local/ (same interface over localStorage)     │
└──────────────────────────────────────────┬──────────────────────────────────────────┘
                                           │  uses the domain
┌────────────────────────── DOMAIN (pure core) ──────────────────────────────────────┐
│  src/core/domain/  entities (Task, Board, User) · value-objects (Checklist, Date)  │
│                   services (taskService, filterService) · constants (statuses,     │
│                   phases, effort, itConfig, initialTasks)   — no React/Firebase    │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Roadmap de Migración (ES) / Migration Roadmap (EN)

### P0 — Fundación (Foundation) ✅ en curso / in progress

- Congelar funcionalidad: no agregar features nuevas mientras se estructura.
- Documentar la arquitectura (este documento).
- Crear `src/core/domain` (núcleo puro) y mover constantes + lógica de negocio.
- Crear `src/ports` (interfaces con JSDoc).
- Separar capas de presentación bajo `src/presentation/`.
- Introducir interfaces y repositorios; mantener la app funcionando en cada paso.

### P1 — Adaptadores y plugins (Adapters & plugins)

- Extraer auth, ui y db en **paquetes** (`src/infrastructure/firebase`, `src/infrastructure/local`).
- Implementar adapters intercambiables: Firebase, Supabase, API REST, etc.
- Crear **sistema de plugins** (registro de adapters en tiempo de ejecución).

### P2 — Bus de eventos / comandos + IA

- **Event Bus** para notificar cambios (auditoría, chat, logs) desacoplado de la UI.
- **Command Bus** para operaciones de escritura (validación centralizada).
- **AI Layer**: servicios de dominio para resúmenes, generación de cartas y detección de patrones.

### P3 — Herramientas

- **CLI** para gestión de boards/tasks desde terminal.
- **Ejemplos** de uso de cada adapter y del sistema de plugins.
- **Docs** ampliadas (ADRs, guías de contribución, diagramas).

### EN

- **P0 — Foundation** (in progress): freeze features; document architecture (this file); create
  `src/core/domain` (pure core) and move constants + business logic; create `src/ports`
  (JSDoc interfaces); reorganize presentation under `src/presentation/`; introduce interfaces and
  repositories while keeping the app working at every step.
- **P1 — Adapters & plugins**: extract auth, ui and db into packages
  (`src/infrastructure/firebase`, `src/infrastructure/local`); implement swappable adapters
  (Firebase, Supabase, REST API, etc.); build a plugin system (runtime adapter registry).
- **P2 — Event/Command bus + AI**: Event Bus for decoupled change notifications (audit, chat,
  logs); Command Bus for writes with centralized validation; AI Layer as domain services
  (summaries, letter generation, absence pattern detection).
- **P3 — Tooling**: CLI for board/task management; examples for each adapter and the plugin
  system; expanded docs (ADRs, contribution guides, diagrams).

---

## 4. Estructura de Capas (ES) / Layer Structure (EN)

```
src/
├── core/                    # DOMAIN — núcleo puro, sin React/Firebase
│   └── domain/
│       ├── entities/        # Task, Board, User (objetos y factories)
│       ├── value-objects/   # Checklist, fechas (parseTaskDate, addDays, ...)
│       ├── services/        # taskService (enrich, overdue, report), filterService
│       └── constants/       # statuses, phaseMap, effortWeight, itConfig, initialTasks
├── application/             # APP — casos de uso, depende solo de src/ports
│   ├── taskUseCases.js
│   ├── boardUseCases.js
│   ├── authUseCases.js
│   └── auditUseCases.js
├── ports/                   # PORTS — interfaces JSDoc
│   ├── TaskRepository.js
│   ├── BoardRepository.js
│   ├── AuthProvider.js
│   └── AuditLogger.js
├── infrastructure/          # INFRA — adapters
│   ├── firebase/            # adapters reales (Firebase)
│   └── local/               # adapters demo (localStorage)
├── app/
│   └── di.js                # Composition root: inyecta adapters según entorno
├── presentation/            # UI — React + Tailwind (views, components, ui, hooks, context)
└── main.jsx                 # Entry point (conecta DI + providers)
```

### ES — Reglas de dependencia

| Capa             | Puede importar                                        | No puede importar                              |
| ---------------- | ----------------------------------------------------- | ---------------------------------------------- |
| `core/domain`    | (nada de la app)                                      | React, Firebase, localStorage, dnd-kit, lucide |
| `application`    | `core`, `ports`                                       | React, Firebase                                |
| `ports`          | `core` (tipos)                                        | implementaciones concretas                     |
| `infrastructure` | `core`, `ports`                                       | React                                          |
| `app/di`         | todo (solo aquí se componen)                          | —                                              |
| `presentation`   | `core` (lectura), `application` (servicios), `app/di` | Firebase directamente                          |

### EN — Dependency rules

| Layer            | May import                                             | Must not import                                |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `core/domain`    | (nothing from the app)                                 | React, Firebase, localStorage, dnd-kit, lucide |
| `application`    | `core`, `ports`                                        | React, Firebase                                |
| `ports`          | `core` (types)                                         | concrete implementations                       |
| `infrastructure` | `core`, `ports`                                        | React                                          |
| `app/di`         | everything (composition only)                          | —                                              |
| `presentation`   | `core` (read-only), `application` (services), `app/di` | Firebase directly                              |

---

## 5. Patrones Aplicables (ES) / Applied Patterns (EN)

| Patrón                     | Uso                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| Repository (ES)            | `TaskRepository`, `BoardRepository`: la UI consulta interfaces; Firebase o localStorage implementan.     |
| Adapter                    | Adaptadores intercambiables por entorno (`local` vs `firebase`) y por proveedor futuro (Supabase, REST). |
| Service Layer              | `src/application/*UseCases` encapsulan casos de uso reutilizables por UI, CLI y Gmail add-on.            |
| Factory / Composition Root | `src/app/di.js` construye el grafo de dependencias según `process.env`/hostname.                         |
| Value Object               | Checklist, fechas y SLA como objetos de dominio inmutables.                                              |
| Plugin Registry (P1)       | Registro en runtime de adapters para extender la app sin tocar el núcleo.                                |

---

## 6. Inventario de Lógica de Dominio a Mover (ES) / Domain Logic to Move (EN)

| Origen actual                                                                                                                                                                                                                                                                                                                       | Destino objetivo                                                    | Tipo                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------- |
| `src/constants/tasks.js` → `initialTasks`                                                                                                                                                                                                                                                                                           | `src/core/domain/constants/tasks.js`                                | Constante de dominio      |
| `src/constants/defaultItConfig.js`                                                                                                                                                                                                                                                                                                  | `src/core/domain/constants/itConfig.js`                             | Constante de dominio      |
| `src/constants/storage.js`                                                                                                                                                                                                                                                                                                          | `src/core/domain/constants/storage.js`                              | Constante de dominio      |
| `src/constants/meta.js` (statuses, phaseMap, effortWeight, operationalStates)                                                                                                                                                                                                                                                       | `src/core/domain/constants/meta.js`                                 | Constante de dominio      |
| `src/constants/meta.js` (statusMeta, phaseColors, priorityMeta, modColors)                                                                                                                                                                                                                                                          | `src/presentation/...` (queda en UI)                                | Metadatos de presentación |
| `src/lib/utils.js` (makeChecklist, enrichLocalTask, checklistProgress, isTaskOverdue, getOperationalState, isReadyToClose, operationalRank, csvCell, parseTaskDate, addDays, startOfMonth, addMonths, endOfMonth, dateInputValue, diffDays, isUrgentTask, groupCounts, reportSummary, cleanValue, displayPersonName, uniqueOptions) | `src/core/domain/services/taskService.js` + `value-objects/date.js` | Servicio de dominio       |
| `src/lib/utils.js` (readLocalJSON, writeLocalJSON, fileToBase64, formatFileSize)                                                                                                                                                                                                                                                    | `src/infrastructure/local/*` (I/O) y `src/presentation/*` (bytes)   | Infraestructura / UI      |
| `src/lib/kanban.js` (filterTasks)                                                                                                                                                                                                                                                                                                   | `src/core/domain/services/filterService.js`                         | Servicio de dominio       |
| `src/lib/kanban.js` (kanbanCollisionDetection, useKanbanSensors)                                                                                                                                                                                                                                                                    | `src/presentation/hooks/useKanbanSensors.js`                        | UI (dnd-kit)              |
| `src/AuthContext.jsx`, `src/BoardContext.jsx`                                                                                                                                                                                                                                                                                       | `src/presentation/context/` (consumen servicios)                    | Presentación              |

### EN

The table above lists the current origin and target destination for every piece of domain logic.
Pure business rules move into `src/core/domain`; UI-only metadata (icons, Tailwind classes, dnd-kit
sensors) stays in `src/presentation`; I/O helpers move to `src/infrastructure`.

---

## 7. Verificación (ES) / Verification (EN)

En cada paso de la migración la app debe seguir compilando y pasando lint:

```bash
npm run build    # build producción sin errores
npm run lint     # ESLint limpio
npm run dev      # modo local (localStorage) sin regresiones
```

### EN

At every migration step the app must keep building and passing lint:

```bash
npm run build    # production build without errors
npm run lint     # clean ESLint
npm run dev      # local mode (localStorage) without regressions
```

---

## 8. Limitaciones conocidas (ES) / Known Limitations (EN)

### ES

- ~~Permisos UI vs reglas de Firestore~~ **Resuelto en P1**: `TaskUseCases.updateTask` sanea el
  patch según el actor (`isManager` o propietario del board), alineado con `firestore.rules`. Un
  miembro no operador solo puede escribir `["status", "operationalState", "order",
  "commentsCount"]`; si el patch queda vacío, no escribe (no-op silencioso, sin error en la UI).
  La regla de avance de estados para no operadores la sigue aplicando Firestore. La UI mantiene
  `appCanEdit` (no cambia).
- ~~Comentarios / mensajes / usuarios~~ **Resuelto en P1**: `CommentRepository`,
  `MessageRepository` y `UserRepository` con adapters Firebase/local; `TaskDetail`, `ChatPanel`,
  el listener de `users` en `App.jsx` y `AdminPanel` usan servicios vía DI.
- ~~Jerarquía de roles~~ **Resuelto en P1**: `jobTitleHierarchy` migrado a
  `core/domain/constants/roles.js` con `isManager`, `effectiveLevel`, `canCreate`,
  `canFullEdit`; `src/constants/defaultItConfig.js` re-exporta desde el dominio (fuente única).
- **Adjuntos**: `TaskDetail` sigue subiendo/eliminando archivos directo a Firebase Storage
  (aún sin port); diferido a una fase posterior.
- **`App.jsx`** sigue siendo un orquestador grande; el siguiente paso es dividir en vistas y
  hooks bajo `src/presentation/`.

### EN

- ~~UI permissions vs Firestore rules~~ **Resolved in P1**: `TaskUseCases.updateTask` sanitizes
  the patch per actor (`isManager` or board owner), aligned with `firestore.rules`. Non-operator
  members can only write `["status", "operationalState", "order", "commentsCount"]`; if the
  patch becomes empty it is skipped (silent no-op, no UI error). The forward-only status rule for
  non-operators is still enforced by Firestore. The UI keeps `appCanEdit` (unchanged).
- ~~Comments / messages / users~~ **Resolved in P1**: `CommentRepository`,
  `MessageRepository` and `UserRepository` with Firebase/local adapters; `TaskDetail`,
  `ChatPanel`, the `users` listener in `App.jsx` and `AdminPanel` now use services via DI.
- ~~Role hierarchy~~ **Resolved in P1**: `jobTitleHierarchy` moved to
  `core/domain/constants/roles.js` with `isManager`, `effectiveLevel`, `canCreate`,
  `canFullEdit`; `src/constants/defaultItConfig.js` re-exports from the domain (single source).
- **Attachments**: `TaskDetail` still uploads/deletes files directly to Firebase Storage (no
  port yet); deferred to a later phase.
- **`App.jsx`** is still a large orchestrator; next step is splitting into views and hooks under
  `src/presentation/`.
