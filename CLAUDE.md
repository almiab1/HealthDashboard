# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HealthDashboard is a body composition tracking app built with **Astro 5 + React 19 + TypeScript** (web) and **Tauri 2 + Rust** (desktop). It has a dual-target architecture: SSR web app with MySQL, and static desktop app with embedded SQLite.

## Commands

```bash
# Development
pnpm dev                  # Start Astro dev server (web)
pnpm desktop:dev          # Start dev server with desktop (Tauri) config
pnpm tauri:dev            # Start Tauri desktop dev

# Build
pnpm build                # Build web app (SSR, output: dist/)
pnpm desktop:build        # Build desktop app (static, output: dist-desktop/)
pnpm tauri:build          # Build Tauri distributable

# Database (web/MySQL only)
pnpm db:generate           # Generate Drizzle ORM migrations
pnpm db:migrate            # Apply migrations
pnpm db:studio             # Open Drizzle Studio (visual DB explorer)
docker compose up -d       # Start MySQL 8.0 container
```

No test framework or linter is currently configured.

## Architecture

> Full details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Deployment: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Dual-Mode Runtime

The app runs in two modes sharing most frontend code:

- **Web mode** (`astro.config.mjs`): SSR with `@astrojs/node`, API routes in `src/pages/api/`, MySQL via Drizzle ORM
- **Desktop mode** (`astro.config.desktop.mjs`): Static pre-rendered build, Tauri IPC to Rust backend, SQLite via rusqlite

`src/lib/database.ts` is the key abstraction layer — it detects the runtime environment and routes data operations to either the Astro API (web) or Tauri IPC commands (desktop). Provides: `createRecord()`, `updateRecord()`, `deleteRecord()`, `getAllRecords()`, `getSetting()`, `setSetting()`, `getAllSettings()`.

### Desktop Build Process

`scripts/build-desktop.sh` swaps `src/pages/` with `src/pages-desktop/` during build. Desktop pages are static versions of the web pages without server-side data fetching. Cross-platform builds via `scripts/deploy.sh`.

### Key Directories

- `src/pages/` — Astro routes (SSR web version) + API endpoints (`api/`)
- `src/pages-desktop/` — Astro routes (static desktop version)
- `src/components/` — React components (`client:load`/`client:only` for interactivity)
- `src/db/` — Drizzle ORM client and MySQL schema definitions
- `src/lib/database.ts` — Runtime-aware database abstraction (web API vs Tauri IPC)
- `src/utils/` — Data interfaces (`RegistroCorporal`), data processing, CSV export
- `src/stores/` — Zustand stores (date filter state)
- `src-tauri/src/lib.rs` — Rust backend: SQLite CRUD + settings operations via Tauri commands

### Database Schema

Two tables: `bodyMetrics` (16 columns of body composition data) and `appSettings` (key-value store). Defined in `src/db/schema.ts` (MySQL/Drizzle) and mirrored in `src-tauri/src/lib.rs` (SQLite).

### Path Alias

`@/*` maps to `src/*` (configured in `tsconfig.json`).

### Documentation

- `docs/ARCHITECTURE.md` — Full system design, data flows, component structure
- `docs/DEPLOYMENT.md` — Build, deploy, CI/CD, environment setup, troubleshooting
- `docs/TAURI_MIGRATION.md` — Desktop/Tauri implementation details
- `docs/healthapp_resume.md` — Technical summary for LLM context

## Conventions

- **Commits**: Conventional Commits format (`feat:`, `fix:`, `docs:`, `refactor:`, etc.)
- **Branching**: GitFlow — `main` (production), `develop` (integration), `feature/*`, `release/*`, `hotfix/*`
- **Package manager**: pnpm (v10.28.2, enforced via `packageManager` field)
- **Styling**: Tailwind CSS 4 with CVA for component variants; dark theme with green/emerald accents
- **UI components**: shadcn/ui pattern in `src/components/ui/`