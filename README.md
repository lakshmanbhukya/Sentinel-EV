# Sentinel EV Frontend

Sentinel EV is a frontend simulation of an intelligent EV charging control platform. This repository currently focuses on the user experience, digital twin visualizations, booking flow behaviors, and self-healing agent interactions in the browser.

## Project Scope

This codebase is frontend-only.

- No backend service is required to run the current demo.
- No ML service is required to run the current demo.
- No MongoDB setup is required to run the current demo.
- Most data shown in the UI is local mock/simulated data.

## Purpose

The project demonstrates how operators and EV users can:

- Monitor station load and grid stress in real time through a digital twin UI.
- Simulate booking behavior with safety-aware status and conflict handling.
- Observe a self-healing agent pipeline: telemetry, fault detection, diagnosis, and recovery actions.
- Explore system behavior through UI components, terminal-style views, and test scenarios.

## What We Used

Loud colors. Hard edges. Zero fluff.

### Core Frontend Stack

[![React](https://img.shields.io/badge/React-19-00D8FF?style=for-the-badge&logo=react&logoColor=0A0A0A)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=FFFFFF)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-FFCC00?style=for-the-badge&logo=vite&logoColor=0A0A0A)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=0A0A0A)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-Latest-FF4D4D?style=for-the-badge&logo=framer&logoColor=FFFFFF)](https://www.framer.com/motion/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Map_Engine-199900?style=for-the-badge&logo=leaflet&logoColor=FFFFFF)](https://leafletjs.com/)
[![React Leaflet](https://img.shields.io/badge/React_Leaflet-UI_Map_Layer-222222?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react-leaflet.js.org/)
[![Leaflet Routing Machine](https://img.shields.io/badge/Leaflet_Routing_Machine-Routing-111111?style=for-the-badge&logo=openstreetmap&logoColor=7EBC6F)](https://www.liedman.net/leaflet-routing-machine/)
[![Zustand](https://img.shields.io/badge/Zustand-State-FF9900?style=for-the-badge&logo=redux&logoColor=111111)](https://zustand-demo.pmnd.rs/)
[![Recharts](https://img.shields.io/badge/Recharts-Charts-FF6A00?style=for-the-badge&logo=chartdotjs&logoColor=FFFFFF)](https://recharts.org/)

### Quality and Tooling

[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?style=for-the-badge&logo=eslint&logoColor=FFFFFF)](https://eslint.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4-7EBC0A?style=for-the-badge&logo=vitest&logoColor=111111)](https://vitest.dev/)
[![Vitest UI](https://img.shields.io/badge/Vitest_UI-Enabled-222222?style=for-the-badge&logo=vitest&logoColor=FCC72B)](https://vitest.dev/guide/ui.html)
[![fast-check](https://img.shields.io/badge/fast--check-Property_Based-00B894?style=for-the-badge&logo=checkmarx&logoColor=FFFFFF)](https://fast-check.dev/)

## Run Locally

```bash
cd app-demo
npm install
npm run dev
```

Default local URL: `http://localhost:5173`

## Test and Build

```bash
cd app-demo
npm test
npm run test:watch
npm run test:ui
npm run lint
npm run build
```

## Key Directories

```text
app-demo/
  src/
    components/       # Map, UI panels, booking and analytics components
    store/            # Zustand state
    data/             # Mock and simulated datasets
    hooks/            # UI and data hooks
    api/              # Frontend API client layer and transformers
    agent/            # Frontend self-healing agent simulation

agent/                # Standalone agent module mirror used for development/testing
```

## Documentation

- App-specific setup and commands: see `app-demo/README.md`
- Agent module details: see `agent/README.md` and `app-demo/src/agent/README.md`

## Notes

- Some files and comments may reference backend/ML plans from earlier iterations.
- The current runnable implementation in this repository is frontend-focused.
- CI includes a GitHub Actions workflow at `.github/workflows/ci-discord-success.yml` that posts to Discord after successful pushes to `main`.
- Add the `DISCORD_WEBHOOK_URL` repository secret to enable notifications.
