# Sentinel EV Frontend App

This folder contains the runnable frontend application for Sentinel EV.

The app is a browser-based simulation focused on:

- Grid-aware EV charging UX
- Digital twin dashboards and map views
- Agent terminal and self-healing workflows
- Local/mock data driven interactions

## Frontend-Only Note

This app runs as a frontend-only project in its current form.

- Backend and ML services are not required for local demo execution.
- Data pipelines are simulated through local modules and mock datasets.

## Tech Used

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Leaflet + React Leaflet
- Zustand
- Recharts
- Vitest + fast-check

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Available Scripts

```bash
npm run dev         # Start dev server
npm run build       # Type-check and build production assets
npm run preview     # Preview production build locally
npm run lint        # Lint source files
npm test            # Run tests once
npm run test:watch  # Run tests in watch mode
npm run test:ui     # Open Vitest UI
```

Default dev URL: `http://localhost:5173`

## High-Level Structure

```text
src/
  components/       # Feature and shared UI components
  hooks/            # Data and UI hooks
  store/            # Zustand stores
  data/             # City/station mock datasets
  api/              # Frontend API abstraction and transformers
  agent/            # Agent simulation logic and terminal UI
```

## Testing

- Unit and integration tests are powered by Vitest.
- Property-based scenarios use fast-check.

## Related Docs

- Workspace overview: `../README.md`
- Agent module details: `src/agent/README.md`
