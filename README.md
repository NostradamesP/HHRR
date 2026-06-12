# Kanban IT Departament

Operational kanban workspace for IT managers who need to assign work, monitor SLA, prioritize blockers, and report on execution without leaving the board.

[Production](https://nostradamesp.github.io/HHRR/) · React · Vite · Firebase · Tailwind CSS

## Overview

Kanban IT Departament is a lightweight IT operations board built for daily management. It combines a dense kanban workflow with task details, checklist tracking, comments, Gantt planning, and board-level reporting.

The app is designed for a small internal IT team where managers need to answer quickly:

- What is overdue?
- Who owns each task?
- Which work is blocked?
- What is ready to close?
- Which systems are creating the most operational load?

## Core Features

- **Kanban board:** compact task cards, drag and drop, column status, archive, delete mode, and empty board states.
- **Task detail modal:** editable task metadata, assignment, SLA, start/due dates, operational state, comments, activity logs, and checklist.
- **Gantt view:** timeline by task dates with quick date/SLA editing.
- **Task list:** operational table view sorted for daily review.
- **Reports:** board metrics, grouped summaries, critical task list, CSV export, and print/PDF support.
- **Board sidebar:** board switching, board chat, member management, and quick filters.
- **Premium login:** public landing screen with interactive auth modal, signup, password reset, and Firebase Auth integration.
- **Local demo mode:** localStorage-backed mode on `localhost` / `127.0.0.1` for development and UI testing without touching Firebase.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Icons:** lucide-react
- **Drag and drop:** `@dnd-kit`
- **Auth and data:** Firebase Auth + Cloud Firestore
- **Hosting:** GitHub Pages via GitHub Actions
- **Admin tooling:** Firebase Admin SDK scripts for controlled local maintenance

## Project Structure

```txt
src/
  App.jsx             Main app, kanban, modal, Gantt, reports, login
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

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev -- --host 0.0.0.0
```

Vite serves the app under the configured base path:

```txt
http://localhost:5173/HHRR/
```

Local behavior:

- `localhost` and `127.0.0.1` use local demo mode.
- Firebase is disabled locally by design.
- Local boards/tasks/comments are persisted in `localStorage`.

To preview the Firebase login page locally, use a non-localhost host exposed by Vite, such as the LAN URL printed by the dev server.

## Environment Variables

Production builds require Firebase web config values through Vite variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

GitHub Actions validates these secrets before building.

## Build

```bash
npm run build
```

Preview the production bundle locally:

```bash
npm run preview
```

## Deployment

The app deploys to GitHub Pages through `.github/workflows/deploy.yml` on every push to `main`.

Repository settings:

```txt
Settings -> Pages -> Source -> GitHub Actions
```

Production URL:

```txt
https://nostradamesp.github.io/HHRR/
```

## Firebase Security

Firestore data is scoped by board:

```txt
boards/{boardId}
boards/{boardId}/tasks/{taskId}
boards/{boardId}/tasks/{taskId}/comments/{commentId}
boards/{boardId}/messages/{messageId}
boards/{boardId}/logs/{logId}
users/{userId}
```

Security model:

- Only board members can read board data.
- Board owners, admins, and managers can operate boards/tasks.
- New users register as `member`.
- Admins manage user roles and job titles.
- Legacy global `/tasks` access is blocked in Firestore rules.

Deploy Firestore rules after authenticating Firebase CLI:

```bash
firebase login
firebase deploy --only firestore:rules
```

## Security Notes

- Never commit `service-account.json`.
- Keep Firebase web config in GitHub Secrets for production.
- Use local admin scripts only from a trusted machine.
- Store future file attachments in Firebase Storage, not in Firestore documents.
- Keep Firestore reads scoped to active board, active task comments, and board chat limits.

## Admin Tooling

List accessible boards with the local Firebase Admin SDK tooling:

```bash
npm run plan:boards
```

Run custom planning/import operations:

```bash
npm run plan -- --help
```

These scripts expect local credentials and should not be used from the browser.

## Operational Data Model

Tasks support optional IT operations fields:

- `system`
- `ticketType`
- `impact`
- `urgency`
- `slaHours`
- `startDate`
- `dueDate`
- `checklist`
- `operationalState`
- `blockedReason`
- `commentsCount`

Existing tasks remain compatible if optional fields are missing.

## Quality Checklist

Before pushing:

```bash
npm run build
git diff --check
```

Manual checks:

- Login modal opens/closes correctly.
- Signup and password reset still work.
- Kanban loads only the active board.
- Drag and drop works across empty and populated columns.
- Task comments update `commentsCount`.
- Gantt, Task list, Reports, Archive, and Sidebar render without console errors.

## Current Product Direction

Near-term priorities:

- Apply and test Firestore rules in Firebase.
- Continue polishing manager workflows.
- Add templates for common IT task types.
- Add richer report exports.
- Plan future attachment support with Firebase Storage.
