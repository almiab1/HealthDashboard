# Application Architecture

## Overview

HealthDashboard is a dual-target application that ships as both a server-rendered web app and a native desktop app from one codebase. The two modes share ~80% of their frontend code, with the runtime abstraction layer (`src/lib/database.ts`) routing data operations transparently to the correct backend.

```
┌─────────────────────────────────────────────────────┐
│                  Shared Frontend                     │
│     Astro 5 + React 19 + Tailwind CSS 4             │
│     Components, Stores, Utilities, Layouts           │
├────────────────────┬────────────────────────────────┤
│    Web Mode (SSR)  │     Desktop Mode (Static)      │
│   astro.config.mjs │  astro.config.desktop.mjs      │
│   src/pages/       │  src/pages-desktop/             │
│   @astrojs/node    │  Tauri 2 (Rust)                │
│   MySQL + Drizzle  │  SQLite + rusqlite             │
│   REST API routes  │  IPC commands                  │
│   output: dist/    │  output: dist-desktop/         │
└────────────────────┴────────────────────────────────┘
```

## Technology Stack

| Layer | Web | Desktop |
|-------|-----|---------|
| Meta-framework | Astro 5 (SSR, `output: 'server'`) | Astro 5 (static, `output: 'static'`) |
| UI | React 19 (`client:load`) | React 19 (`client:only="react"`) |
| Styling | Tailwind CSS 4 + CVA | Same |
| State | Zustand (date filter store) | Same |
| Charts | Recharts | Same |
| Database | MySQL 8.0 via Drizzle ORM | SQLite via rusqlite (Rust) |
| API | Astro API routes (`/api/*`) | Tauri IPC commands |
| Runtime | Node.js | Tauri 2 (Rust + WebView) |

## Dual-Mode Runtime

### How mode detection works

The build flag `TAURI_BUILD` is injected at compile time by `astro.config.desktop.mjs`:

```javascript
// astro.config.desktop.mjs
vite: {
  define: { 'import.meta.env.TAURI_BUILD': JSON.stringify('true') }
}
```

Astro pages check this flag to decide what to render:

```astro
// src/pages/index.astro
const isTauriBuild = import.meta.env.TAURI_BUILD === 'true';

{isTauriBuild ? (
  <DashboardDesktop client:only="react" />   <!-- Client-side React, loads data via IPC -->
) : (
  <!-- SSR HTML with server-fetched data -->
)}
```

At runtime, the `database.ts` abstraction detects Tauri by checking for `window.__TAURI__` globals:

```typescript
function isTauri(): boolean {
  return Boolean(window.__TAURI__ || window.__TAURI_INTERNALS__);
}
```

### Data flow comparison

**Web mode:**
```
Browser → Astro SSR → getProcessedData() → Drizzle ORM → MySQL
                                                  ↕
Browser → fetch('/api/records') → API route → Drizzle ORM → MySQL
```

**Desktop mode:**
```
WebView → React component → database.ts → invoke() → Tauri IPC → lib.rs → SQLite
```

## Directory Structure

```
HealthDashboard/
├── src/
│   ├── pages/                  # Web routes (SSR) + API endpoints
│   │   ├── api/
│   │   │   ├── records.ts      # POST /api/records
│   │   │   ├── records/[id].ts # PUT/DELETE /api/records/:id
│   │   │   └── settings.ts     # GET/PUT /api/settings
│   │   ├── index.astro         # Dashboard
│   │   ├── register.astro      # New measurement form
│   │   ├── history.astro       # Historical data table
│   │   ├── settings.astro      # Settings + CSV export
│   │   └── guia.astro          # Metrics guide
│   │
│   ├── pages-desktop/          # Desktop routes (static, no SSR)
│   │   ├── index.astro         # → <DashboardDesktop client:only />
│   │   ├── register.astro      # → <RegisterForm client:only />
│   │   ├── history.astro       # → <HistoryDesktop client:only />
│   │   ├── settings.astro      # → <SettingsDesktop client:only />
│   │   └── guia.astro          # Static guide content
│   │
│   ├── components/
│   │   ├── dashboard/          # MetricCard, DateFilter, DashboardDesktop, RecentTable
│   │   ├── history/            # HistoryTable, HistoryDesktop
│   │   ├── register/           # RegisterForm
│   │   ├── settings/           # SettingsForm, SettingsDesktop
│   │   ├── layout/             # Navbar
│   │   └── ui/                 # Button, Card, Table, Tooltip, DownloadButton
│   │
│   ├── lib/
│   │   └── database.ts         # Runtime abstraction layer (web API ↔ Tauri IPC)
│   │
│   ├── db/                     # Web-only: Drizzle ORM
│   │   ├── client.ts           # MySQL connection pool (uses DATABASE_URL)
│   │   └── schema.ts           # Table definitions (bodyMetrics, appSettings)
│   │
│   ├── stores/
│   │   └── useDateFilterStore.ts  # Zustand: date range filter state
│   │
│   ├── utils/
│   │   ├── data.ts             # RegistroCorporal interface definitions
│   │   ├── dataProcessor.ts    # DB record → UI model mapping, delta calculations
│   │   ├── settings.ts         # Server-side settings helpers (web only)
│   │   └── export.ts           # CSV generation + download (web) / save dialog (desktop)
│   │
│   ├── layouts/
│   │   └── MainLayout.astro    # Shell: <html>, Navbar, Toaster, global styles
│   │
│   └── styles/
│       └── global.css          # Tailwind base + custom theme
│
├── src-tauri/                  # Rust desktop backend
│   ├── src/lib.rs              # SQLite CRUD, Tauri commands, DB init
│   ├── tauri.conf.json         # Window config, bundle settings, build hooks
│   └── Cargo.toml              # Rust dependencies
│
├── scripts/
│   ├── build-desktop.sh        # Page-swap build for static desktop output
│   └── deploy.sh               # Cross-platform build (Linux + Windows from WSL)
│
├── astro.config.mjs            # Web config: SSR + @astrojs/node
├── astro.config.desktop.mjs    # Desktop config: static + TAURI_BUILD flag
├── docker-compose.yml          # MySQL 8.0 for local web development
├── drizzle.config.ts           # Drizzle Kit migration config
└── .github/workflows/
    └── build-release.yml       # CI: build + release for all platforms
```

## The Runtime Abstraction Layer

`src/lib/database.ts` is the critical bridge that makes shared components work across both modes. Every data operation goes through this module.

### Records API

| Function | Web Mode | Desktop Mode |
|----------|----------|--------------|
| `createRecord(data)` | `POST /api/records` | `invoke('create_record', { data })` |
| `updateRecord(id, data)` | `PUT /api/records/:id` | `invoke('update_record', { id, data })` |
| `deleteRecord(id)` | `DELETE /api/records/:id` | `invoke('delete_record', { id })` |
| `getAllRecords()` | Returns `[]` (SSR handles this) | `invoke('get_all_records', {})` |

### Settings API

| Function | Web Mode | Desktop Mode |
|----------|----------|--------------|
| `getSetting(key)` | `GET /api/settings?key=...` | `invoke('get_setting', { key })` |
| `setSetting(key, value)` | `PUT /api/settings` | `invoke('set_setting', { key, value })` |
| `getAllSettings()` | Returns `[]` | `invoke('get_all_settings', {})` |

### Type conversions

The layer handles three data representations:

1. **`RecordInput`** — Form input (strings, DD/MM/YYYY dates)
2. **`TauriBodyMetric`** — Rust-compatible (numbers, ISO dates)
3. **`RegistroCorporal`** — UI display (numbers, JS Date objects)

Conversion chain: `RecordInput` → `inputToTauriMetric()` → SQLite/MySQL → `tauriMetricToRegistro()` → `RegistroCorporal`

## Database Schema

Both backends implement the same logical schema:

### `body_metrics` / `bodyMetrics`

| Column | MySQL (Drizzle) | SQLite (rusqlite) |
|--------|-----------------|-------------------|
| id | `INT AUTO_INCREMENT PK` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| recorded_at | `DATE NOT NULL` | `TEXT NOT NULL` (ISO 8601) |
| weight | `DECIMAL(5,2) NOT NULL` | `REAL NOT NULL` |
| bmi | `DECIMAL(4,1)` | `REAL` |
| fat_mass_kg | `DECIMAL(5,2)` | `REAL` |
| fat_mass_percent | `DECIMAL(4,1)` | `REAL` |
| muscle_mass_kg | `DECIMAL(5,2)` | `REAL` |
| free_mass_kg | `DECIMAL(5,2)` | `REAL` |
| water_kg | `DECIMAL(5,2)` | `REAL` |
| water_percent | `DECIMAL(4,1)` | `REAL` |
| bone_mass_kg | `DECIMAL(4,2)` | `REAL` |
| visceral_fat | `DECIMAL(4,1)` | `REAL` |
| bmr | `DECIMAL(6,2)` | `REAL` |
| metabolic_age | `TINYINT` | `INTEGER` |
| phase_angle | `DECIMAL(4,2)` | `REAL` |
| resistance | `DECIMAL(6,2)` | `REAL` |
| reactance | `DECIMAL(6,2)` | `REAL` |
| created_at | `TIMESTAMP DEFAULT NOW()` | `TEXT DEFAULT CURRENT_TIMESTAMP` |

### `app_settings` / `appSettings`

| Column | MySQL | SQLite |
|--------|-------|--------|
| key | `VARCHAR(50) UNIQUE NOT NULL` | `TEXT PRIMARY KEY NOT NULL` |
| value | `VARCHAR(255) NOT NULL` | `TEXT NOT NULL` |

Desktop SQLite is stored at `{USER_DATA_DIR}/healthdashboard/data.db` (auto-created on first run).

## Desktop Build Process

The `scripts/build-desktop.sh` script handles the page-swap build:

```
1. Backup src/pages/ → src/.pages-backup/
2. Copy src/pages-desktop/ → src/pages/
3. Run: astro build --config astro.config.desktop.mjs
4. Restore src/pages/ from backup (runs even on build failure via trap)
```

This produces a static HTML/CSS/JS bundle in `dist-desktop/` that Tauri embeds into the native binary.

The `beforeBuildCommand` in `tauri.conf.json` points to `npm run desktop:build`, so `pnpm tauri:build` triggers this automatically.

## State Management

A single Zustand store (`useDateFilterStore`) manages the date filter state shared across dashboard components:

- Predefined ranges: 30d, 3m, 6m, 1y, YTD, all
- Custom date range support
- Consumed by `MetricCard` to filter chart data
- Consumed by `DateFilter` UI component

## Component Hydration Strategy

| Directive | Usage |
|-----------|-------|
| `client:load` | Interactive components on SSR pages (MetricCard, DateFilter, SettingsForm) |
| `client:only="react"` | Desktop-only components that fetch their own data (DashboardDesktop, HistoryDesktop) |
| `client:visible` | Deferred hydration for below-fold components (MetricTooltip) |
| None (Astro) | Static server-rendered components (Navbar, RecentTable, MainLayout) |

## Styling

- Dark theme: backgrounds `#0d1a12` / `#111c16`, borders `#1e3327`
- Accent: emerald-400/500 for positive states, red-400 for negative
- Fonts: Inter (body), loaded via `@fontsource/inter`
- Component variants: CVA (Class Variance Authority) for shadcn/ui components
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints
