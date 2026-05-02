# Docflow — Agent Instructions

## Architecture

- **Single-page React app.** The entire editor lives in `src/App.jsx` (~670 lines).
- **Editor:** TipTap 2 (`useEditor` hook). No state management library, no router, no backend.
- **Draft Mode only.** Content is hardcoded in `initialContent` and lives only in editor state. No persistence, no auth.

## Key files

| File | What to know |
|------|-------------|
| `src/App.jsx` | Everything. Editor init, toolbar, context menu, link modal, image paste, file upload. Edit this first. |
| `src/extensions/imageResize.js` | Custom TipTap extension — extends `@tiptap/extension-image` with a draggable resize handle via `addNodeView`. |
| `src/index.css` | Prose/typography overrides for dark slate theme + task list checkbox styling. |
| `vite.config.js` | Dev server runs on port **3000**, `host: true` (binds to all interfaces). |
| `Dockerfile` | Multi-stage: `node:20-alpine` build → `nginx:alpine` serve. |
| `docker-compose.yml` | Maps container port 80 → host **8090**. |

## Commands

```bash
npm run dev          # Dev server, http://localhost:3000
npm run build        # Output → dist/
npm run preview      # Preview build locally
docker-compose up --build   # Full stack, http://localhost:8090
```

## Gotchas

- **Toolbar buttons use `onMouseDown`** — not `onClick`. TipTap cancels focus on mousedown; the `onMouseDown={(e) => e.preventDefault()}` on each button preserves editor focus. Adding new buttons must follow this pattern.
- **Image paste** is handled via `editorProps.handleDOMEvents.paste` — intercepts clipboard, reads images as base64, calls `editor.commands.setImage()`.
- **Table context menu** fires on `contextmenu` DOM event when `target.closest('table')`. It's a fixed-position overlay with position-adjustment logic to avoid viewport overflow.
- **`initialContent`** is a template string in `App.jsx:39`. Any content changes must update this.
- **TipTap extensions** are configured inline in `useEditor()` — adding/removing extensions means updating both the import and the `extensions` array in the same file.
- **Nginx caching:** static assets (`js|css|png|jpg|...|woff2`) are served with `expires 1y` and `Cache-Control: public, immutable`.

## Conventions

- No lint/typecheck/test scripts defined in `package.json`. If adding them later, run manually before committing.
- All components are defined inline in `App.jsx` (no separate files).
- Tailwind utility classes throughout; no CSS modules.
