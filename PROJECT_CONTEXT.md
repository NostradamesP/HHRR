# PROJECT_CONTEXT — NoraHR / Kanban IT Department

> Kanban operativo para gestión de equipos IT: boards, tareas arrastrables, vista Gantt, reportes, SLA, roles de usuario, y chat en tiempo real.

---

## 🎯 Propósito

Plataforma de gestión de tareas IT tipo Kanban con modo dual (demo local / producción Firebase). Permite crear boards personalizados, asignar tareas con prioridades y fechas, gestionar equipos por roles, y visualizar cronogramas en Gantt.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework UI | React | ^18.3.1 |
| Bundler | Vite | ^8.0.16 |
| Estilos | Tailwind CSS | ^3.4.17 |
| Drag & Drop | @dnd-kit (core + sortable + utilities) | ^6.3.1 |
| Iconos | lucide-react | ^1.16.0 |
| Backend | Firebase Auth + Firestore | ^12.13.0 |
| Linting | ESLint v9 flat config | ^9.39.4 |
| Formateo | Prettier | ^3.8.4 |
| CI/CD | GitHub Actions → GitHub Pages | — |
| Admin CLI | Firebase Admin SDK (scripts/) | ^10.3.0 |

## 📁 Estructura del Proyecto

```
HHRR/
├── index.html                     # Entry point (lang="es")
├── vite.config.js                 # Base path /HHRR/
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── firebase.json                  # Hosting + Firestore rules
├── firestore.rules                # 189 líneas de reglas por rol
├── .env.example                   # 7 variables VITE_FIREBASE_*
├── .github/workflows/deploy.yml   # CI/CD a GitHub Pages
│
├── src/
│   ├── main.jsx                   # ReactDOM.createRoot
│   ├── App.jsx                    # Router: kanban, modal, Gantt, reportes, login
│   ├── firebase.js                # Init Firebase desde VITE_ env vars
│   ├── AuthContext.jsx            # Contexto de autenticación
│   ├── BoardContext.jsx           # Contexto de boards (CRUD, membresía)
│   ├── ChatPanel.jsx              # Chat en tiempo real por board
│   ├── Sidebar.jsx                # Lista de boards, búsqueda, chat, miembros
│   ├── styles.css                 # Tailwind entry + custom
│   ├── branding.js                # Nombres visibles y mapeo legacy
│   │
│   ├── components/
│   │   ├── config/                # AdminPanel, ITConfigPanel
│   │   ├── kanban/                # Column, SortableCard, CardContent
│   │   ├── landing/               # LandingPage, LoginModal
│   │   ├── ui/                    # Avatar, Modal, Toast, LoadingScreen, etc.
│   │   └── views/                 # GanttView, ReportsView, TaskDetail, TaskForm
│   ├── constants/                 # defaultItConfig, meta, storage, tasks
│   └── lib/                       # kanban.js (lógica), utils.js
│
├── scripts/
│   ├── nora-writer.mjs            # CLI Firebase Admin SDK
│   ├── update-kanban.mjs          # Actualización masiva de tareas
│   └── plan-nora-signage.json
│
├── public/favicon.svg
└── dist/                          # Build de producción
```

## 🚀 Comandos Esenciales

```bash
npm run dev              # Servidor desarrollo Vite (localhost:5173/HHRR/)
npm run build            # Build producción → dist/
npm run preview          # Preview del build local
npm run lint             # ESLint sobre src/
npm run format           # Prettier sobre src/
npm run plan             # CLI: nora-writer.mjs (requiere service-account.json)
npm run plan:boards      # Lista boards disponibles en Firestore
```

## 🧪 Modo Dual (Demo / Producción)

| Entorno | Persistencia | Comportamiento |
|---|---|---|
| `localhost` / `127.0.0.1` | **localStorage** | Modo demo, Firebase deshabilitado |
| Cualquier otro host | **Firebase Auth + Firestore** | Modo producción |

## 👥 Roles de Usuario

| Rol | Permisos |
|---|---|
| **admin** | CRUD completo: usuarios, boards, tareas, configuración IT |
| **manager** | Operación de boards: crear/editar tareas, gestionar miembros |
| **member** | Cambios limitados: solo estado de tareas asignadas |

## 🗄️ Firestore — Colecciones

- `users/{uid}` — Perfiles y roles
- `boards/{boardId}` — Tableros con membresía
- `tasks/{taskId}` — Tareas con estado, prioridad, asignación
- `comments/{commentId}` — Comentarios en tareas
- `messages/{messageId}` — Chat en tiempo real
- `logs/{logId}` — Auditoría de cambios

## 📐 Convenciones de Código

- **Nombres**: Componentes en PascalCase (`TaskDetail.jsx`), archivos en camelCase (`authContext.jsx`).
- **Estilos**: Tailwind utility classes sobre CSS personalizado.
- **Linting**: ESLint flat config con reglas React + React Hooks.
- **Formateo**: Prettier (semicolons, double quotes, tabWidth 2, trailingComma all).
- **Commits** en inglés descriptivo.
- **No subir** `.env` con claves reales ni `service-account.json`.

## 🔐 Seguridad

- **Firestore rules**: validación por rol y membresía de board.
- **CSP** configurada en `firebase.json`.
- **CI/CD**: valida que todos los secrets `VITE_FIREBASE_*` existan antes de buildear.
- **Variables de entorno**: 7 variables `VITE_FIREBASE_*` para conectar Firebase.

## 📊 Estado del Proyecto

- **Producción activa** en: https://nostradamesp.github.io/HHRR/
- **CI/CD**: Automático en cada push a `main` → build + deploy a GitHub Pages.
- **Gmail Add-on**: Google Apps Script en `/gmail-addon/` (excluido del repo vía `.gitignore`).

## 🔗 Enlaces

- Repo: https://github.com/NostradamesP/HHRR
- Firebase Project: `kanba-local-no-saas`
- Ver también: `AGENTS.md` en este directorio
