# HHRR — NoraHR Kanban IT

## Stack
- React 18, Vite 6, Tailwind CSS 3, JavaScript (JSX)
- Estado: React Context API (AuthContext, BoardContext)
- Drag & Drop: @dnd-kit/core, @dnd-kit/sortable
- Íconos: lucide-react
- Backend: Firebase (Firestore, Auth)
- Deploy: GitHub Pages vía GitHub Actions
- Gmail Add-on: Google Apps Script en /gmail-addon/

## Convenciones
- Componentes PascalCase, archivos camelCase (app.jsx, authContext.jsx)
- Tailwind utility classes sobre CSS personalizado
- Commits en inglés descriptivo

## Comandos
```bash
npm run dev      # servidor de desarrollo Vite
npm run build    # build producción
npm run preview  # preview del build
```

## Reglas
- Demo local (localhost): usa localStorage
- Producción: usa Firebase Firestore
- Admin: CRUD completo (crear/eliminar tableros)
- Member: solo cambios de estado limitados
- No subir .env con claves reales

## Scripts especiales
- `npm run plan` — ejecuta nora-writer.mjs
- `npm run plan:boards` — lista tableros disponibles
