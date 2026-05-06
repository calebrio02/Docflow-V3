# Docflow — Agent Instructions

## Architecture

- **Frontend:** React 19 + Vite 6 + TipTap 2. Everything in `src/App.jsx` (~1580 lines). All inline components — no separate component files.
- **Backend:** Express 4 + PostgreSQL 16 in `server/server.js` (~400 lines). Auto-creates tables on startup.
- **Auth:** Bearer token. Login → token saved to `localStorage('docflow-token')`. Server validates via `process.env.AUTH_TOKEN` (default: `docflow-production-token-7f8a9b2c`). Default creds: `admin` / `admin123`.
- **Storage:** Documents persist to PostgreSQL via `PUT /api/documents/:id`. Drafts also saved to `localStorage('docflow-draft-content')` every 500ms (legacy).
- **Files:** Images uploaded → converted to WebP via `sharp`. Videos stored as-is. Both served from `server/data/uploads` via `/uploads/`. Shared as Docker volume.

## Commands

```bash
npm run dev              # Vite dev server → http://localhost:3000
npm run dev:api          # Express API → http://localhost:4000
npm run dev:all          # Both concurrently (requires `concurrently` in server/package.json)
npm run build            # → dist/
docker-compose up --build   # Full stack (db+api+web) → http://localhost:8090
docker compose build --no-cache  # Rebuild after every frontend change (nginx caches assets)
```

## Gotchas

- **`editorRef` pattern required.** The TipTap `editor` instance is stored in `useRef` and synced via `useEffect` (`editorRef.current = editor`). Any callback that references `editor` (in `useCallback` deps or closures) **must** use `editorRef.current` instead. Direct `editor` references cause `Cannot access 'De' before initialization` in minified bundles.
- **Toolbar buttons use `onMouseDown={(e) => e.preventDefault()} + onClick`.** TipTap steals focus on mousedown. Adding new buttons must follow this pattern exactly.
- **Video extension** (`src/extensions/videoResize.js`) is a TipTap block-level node. Resize is handled externally via `MutationObserver` in App.jsx (not via `addNodeView` — that breaks node serialization). Videos are wrapped in a `<div>` with a circular handle; resize updates `width`/`height` attrs via `tr.setNodeMarkup()`.
- **Image paste** intercepts via `editorProps.handleDOMEvents.paste`, reads images as base64, calls `processFile()` which uploads to backend and dispatches `editor.commands.setImage()`.
- **Table context menu** fires on `contextmenu` DOM event when `target.closest('table')`. Fixed-position overlay with viewport-boundary correction.
- **Nginx caching:** `expires 1y` + `Cache-Control: public, immutable` on static assets. Never skip `--no-cache` rebuild.
- **`initialContent`** is a template string at `App.jsx:50`.
- **`server/server.js`** runs `initDB()` synchronously before `app.listen()`. Creates tables and default admin user on every start.

## Key files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Everything. Editor, auth, sidebar, modals, toolbar, video resize observer, paste handler. |
| `src/extensions/videoResize.js` | TipTap `video` node — `insertVideo` command, `src`/`width`/`height` attrs. |
| `src/extensions/imageResize.js` | Extends `@tiptap/extension-image` with `addNodeView` resize handle. |
| `src/api.js` | Fetch client for `/api/*` endpoints. Attaches `Bearer` token. |
| `server/server.js` | Express API: auth login, folders CRUD, documents CRUD, file upload (multer + sharp), export. |
| `docker-compose.yml` | 3 services: `db` (pg), `api` (express), `web` (nginx). Shared `uploads_data` volume. |
| `docker/nginx/default.conf` | Proxies `/api/` → `api:4000`, serves static from `/usr/share/nginx/html`, caches aggressively. |
| `vite.config.js` | Dev server port **3000**, `host: true`. |

## Conventions

- No lint/typecheck/test scripts. Verify manually.
- Tailwind utility classes throughout. No CSS modules.
- Spanish UI strings (toolbar labels, context menu, modals).
