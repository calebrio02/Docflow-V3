# Docflow

A modern rich text editor built with React and TipTap. Docflow provides a full-featured writing experience with formatting, tables, task lists, images, and more — all running locally in your browser.

## Features

- **Rich Text Editing** — Bold, italic, strikethrough, code, headings (H1–H3)
- **Lists** — Bullet lists, numbered lists, and checkable todo (task) lists with nested support
- **Text Alignment** — Left, center, and right alignment for paragraphs and headings
- **Tables** — Insert resizable tables with a right-click context menu to add/remove rows and columns
- **Images** — Upload via button or paste from clipboard (Ctrl+V); resize images by dragging the corner handle
- **Links** — Add, edit, and remove hyperlinks via modal dialog
- **Blockquotes & Code Blocks** — Citation-style callouts and fenced code blocks
- **Horizontal Rules** — Section dividers
- **Undo / Redo** — Full history navigation
- **Draft Mode** — All content stays local; no backend required (Phase 1)

## Tech Stack

- **Frontend:** React 19 + Vite 6
- **Styling:** Tailwind CSS 3 + @tailwindcss/typography
- **Editor:** TipTap 2 (StarterKit + Image, Table, TaskList, Link, TextAlign extensions)
- **Icons:** Lucide React
- **Deployment:** Docker (Nginx)

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)
- Docker & Docker Compose (optional, for containerized deployment)

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview   # Preview the production build locally
```

### Docker

```bash
# Build and run with Docker Compose (http://localhost:8090)
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

## Project Structure

```
├── docker/
│   └── nginx/
│       └── default.conf      # Nginx configuration
├── dist/                     # Build output
├── src/
│   ├── extensions/
│   │   └── imageResize.js    # Custom TipTap image resize extension
│   ├── App.jsx               # Main app component (editor, toolbar, modals)
│   ├── index.css             # Global styles & prose overrides
│   └── main.jsx              # Entry point
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Docker Compose configuration
├── index.html                # HTML entry point
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server on port 3000 |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview production build locally |

## License

Private
