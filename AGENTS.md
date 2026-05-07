# Docflow — Agent Instructions

## Architecture

- **Frontend:** React 19 + Vite 6 + BlockNote 0.50 + TipTap extensions (image/video resize). Tailwind CSS 3 + `darkMode: 'class'` + Mantine 9. All in `src/App.jsx`.
- **Backend:** Express 4 + PostgreSQL 16 in `server/server.js`. JWT auth (jsonwebtoken, 7-day expiry). Auto-creates tables on startup via `runMigrations()`.
- **Auth:** JWT stored in `localStorage('docflow-token')`. Server validates via `JWT_SECRET` env (default: `docflow-jwt-secret-2025-change-in-production`). Default creds: `admin` / `admin123`.
- **Roles:** `viewer(1) < editor(2) < owner(3)` — enforced per-project via `requireRole()`.
- **Storage:** Draft content → `documents.content` (JSONB). Published content → `documents.published_content` (JSONB). File uploads → `server/data/uploads` (multer, auto-WebP via sharp).
- **Routes:** `/` = dashboard, `/project/:id` = workspace, `/document/:id` = editor, `/share/:token` = public read-only, `/invite/:token` = accept invite.

## Commands

```bash
npm install                         # Install deps
npm run dev                         # Vite dev server → http://localhost:3000
npm run dev:api                     # Express API → http://localhost:4000 (node --watch, hot reload)
npm run dev:all                     # Both servers concurrently
npm run build                       # → dist/
docker compose up                   # Full stack (Nginx + API + DB) → http://localhost:8090
docker compose build --no-cache     # Mandatory after every frontend change (nginx: 1y cache)
docker compose down -v              # Wipe all data (volumes)
```

## Environment

| Variable | Default | Where used |
|----------|---------|------------|
| `JWT_SECRET` | `docflow-jwt-secret-2025-change-in-production` | server/server.js |
| `AUTH_TOKEN` | `docflow-production-token-7f8a9b2c` | Docker Compose (legacy) |
| `DATABASE_URL` | `postgresql://docflow:docflow@db:5432/docflow` | Docker Compose API |
| `PORT` | `4000` | Docker Compose API |

`docker-compose.prod.yml` — identical but omits API port mapping (expects reverse proxy).

## Gotchas

- **PostgreSQL JSONB cast.** `'[]'` is `text`, not `jsonb`. Always use `::jsonb`: `COALESCE($4::jsonb, '[]'::jsonb)`.
- **PUT parameter indexing.** Dynamic UPDATE queries must track `${idx}` carefully — params array and SQL placeholders must align exactly.
- **Toolbar buttons use `onMouseDown={(e) => e.preventDefault()} + onClick`.** TipTap steals focus on mousedown.
- **`initDB()` / `runMigrations()` runs safely on startup.** Creates tables, adds columns via `DO $$ BEGIN ... END $$` blocks (not `try/catch` which aborts PostgreSQL transactions).
- **Vite proxies `/api` to `http://localhost:4000`.** During local dev, API calls go through the Vite dev server.
- **Docker uses Node 20 Alpine** for both stages (frontend Dockerfile + server/Dockerfile). Server Dockerfile installs sharp deps (vips-dev, fftw-dev, libjpeg-turbo-dev, libpng-dev, g++, make, python3).
- **Nginx serves static files + proxies `/api/`** to `api:4000` + serves `/uploads/` from shared volume. SPA fallback for all other routes.
- **Documents have draft vs published states.** Editing modifies `content`; `createRelease` snapshots content to `published_content`. Copying a document clones content and preserves releases as history.

## Key files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app: Dashboard, Workspace, EditorView, ShareView, InviteRoute. |
| `src/components/Editor/BlockNoteEditor.jsx` | BlockNote editor wrapper with dark mode detection. |
| `src/components/auth/AuthScreens.jsx` | Login, Register (invitation-only), InviteAccept screens. |
| `src/components/modals/DocModals.jsx` | CreateProject, Release, Share, Invite, ReleaseView, Rename modals. |
| `src/components/panels/SidePanels.jsx` | MembersPanel, ReleasePanel (changelog). |
| `src/components/admin/AdminPanel.jsx` | Admin: Users, Invite, Invitations tabs. |
| `src/api.js` | Fetch client. Stores `docflow-token` in localStorage. Handles 401 cleanup. |
| `server/server.js` | Express API: auth, admin, projects, members, invites, folders, documents, releases, share, upload, export. |
| `server/Dockerfile` | Server container with sharp/image optimization deps. |
| `docker/nginx/default.conf` | Nginx: static serve, `/api/` proxy, `/uploads/` volume, SPA fallback, gzip. |
| `src/extensions/imageResize.js` | Custom TipTap image extension with drag-to-resize. |
| `src/extensions/videoResize.js` | Custom TipTap video node extension with proportional resize. |

## Conventions

- No lint/typecheck/test scripts. Verify manually.
- Tailwind utility classes throughout. No CSS modules.
- English UI strings.
- Documents belong to projects. Folders are nested via `parent_folder_id`.
