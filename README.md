# DocFlow

Document management application built with React, Vite, and Tailwind CSS.

## Tech Stack

- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS + @tailwindcss/typography
- **Editor:** Tiptap (rich text editor with tables, task lists, text alignment)
- **Icons:** Lucide React
- **Deployment:** Docker

## Prerequisites

- Node.js 18+
- npm
- Docker (optional)

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# The app will be available at http://localhost:8090
```

## Project Structure

```
├── docker/
├── src/
├── Dockerfile
├── docker-compose.yml
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## License

Private
