# Docflow — Agent Instructions

## Architecture

- **Frontend:** React 19 + Vite 6 + BlockNote (`@blocknote/react` 0.50) + TipTap. Everything in `src/App.jsx`. Tailwind CSS.
- **Backend:** Express 4 + PostgreSQL 16 in `server/server.js`. Auto-creates tables on startup via `initDB()`.
- **Auth:** Bearer token stored in `localStorage('docflow-token')`. Server validates against `process.env.AUTH_TOKEN` (default: `docflow-production-token-7f8a9b2c`). Default creds: `admin` / `admin123`.
- **Storage:** Document draft content → `documents.content` (JSONB). Published content → `documents.published_content` (JSONB). Files → `server/data/uploads` (shared Docker volume).
- **Frontend routes:** `/` = editor, `/share/:token` = public read-only, `/invite/:token` = accept invite.

## Commands

```bash
npm run dev              # Vite dev server → http://localhost:3000
npm run dev:api          # Express API → http://localhost:4000
npm run build            # → dist/
docker compose up        # Full stack → http://localhost:8090
docker compose build --no-cache   # Mandatory after every frontend change (nginx caches with expires 1y)
docker compose down -v   # Wipe all data (volumes)
```

`npm run dev:all` (concurrently) is defined in `package.json` but `concurrently` is **not installed** — install it first or run the two commands separately.

## Auth flow

- `POST /api/auth/login` → `{ token, userId, username, email }`. Frontend saves `token` to `localStorage('docflow-token')` and `userId` to `localStorage('docflow-userId')`.
- `POST /api/auth/register` — only works with `invitationToken` (invitation-only signup).
- `POST /api/invitations/accept` — used by invite acceptance view.

## Gotchas

- **`X-User-Id` header required.** Every request to a protected endpoint must include `X-User-Id` header with the integer userId from login response. `api.js` handles this automatically via `localStorage('docflow-userId')`.
- **PostgreSQL JSONB cast.** `'[]'` is `text`, not `jsonb`. Always use `::jsonb`: `COALESCE($4::jsonb, '[]'::jsonb)`.
- **PUT parameter indexing.** Dynamic UPDATE queries must track `${idx}` carefully — params array and SQL placeholders must align exactly.
- **Toolbar buttons use `onMouseDown={(e) => e.preventDefault()} + onClick`.** TipTap steals focus on mousedown.
- **`initDB()` runs migrations safely.** It no longer drops tables on startup.
- **BlockNote integrated.** Full integration is now in `src/components/Editor/BlockNoteEditor.jsx`.
- **`concurrently` is installed.** `npm run dev:all` works out of the box.

## Key files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main application entry and state management. |
| `src/components/` | Modular UI components (Auth, Modals, Panels, Editor). |
| `src/api.js` | Fetch client. Stores `docflow-token` and `docflow-userId` in localStorage. |
| `server/server.js` | Express API: auth, projects, members, invites, folders, documents, releases, share, upload, export. |

## Conventions

- No lint/typecheck/test scripts. Verify manually.
- Tailwind utility classes throughout. No CSS modules.
- English UI strings.
- All data migrations use `DO $$ BEGIN ... END $$` blocks (not `try/catch` which aborts PostgreSQL transactions).
- Documents belong to projects. Folders are sub-nested within projects.
- Copying a document clones content and preserves releases as history.
