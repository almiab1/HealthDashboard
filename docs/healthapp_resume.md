# Technical Report: HealthDashboard Application

This document serves as technical and functional context for an LLM, detailing the architecture, tech stack, data model, and business logic of the HealthDashboard application.

## 1. Project Summary

**HealthDashboard** is a dual-target (web + desktop) application for tracking and visualizing body composition metrics. It allows a user to register, visualize, and analyze their physical progress over time, based on detailed bioimpedance data (Tanita MC-780MA or similar).

### Main Features
- **Main Dashboard:** Key metrics (Weight, % Fat, Muscle Mass) with trend indicators and area charts in a side-by-side layout (charts left, recent table right).
- **Data Management:** Persistent storage in MySQL (web) or embedded SQLite (desktop) with a unified abstraction layer.
- **Measurement Registration:** Form to enter new data, saved through the runtime-aware database layer.
- **History:** Detailed table of records with date filtering, sorting, and edit/delete actions.
- **Settings:** User profile (username), record statistics, and CSV export.
- **Guide:** 12 detailed metric explanation cards with icons, definitions, and interpretation guidance.
- **Filtering:** Predefined or custom date ranges (global state with Zustand).
- **CSV Export:** Browser download (web) or native save dialog (desktop via Tauri).

## 2. Tech Stack

The application uses a dual-mode architecture based on **Astro** with interactive React islands.

- **Core Framework:** [Astro v5](https://astro.build) — SSR (web) or static (desktop).
- **UI Framework:** [React v19](https://react.dev).
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com) with CVA for component variants.
- **Icons:** `lucide-react`.
- **Data Visualization:** `recharts` for area charts.
- **Global State:** `zustand` (date filter store).
- **Notifications:** `sonner` (toast notifications).
- **Web Backend:** Node.js via `@astrojs/node`, MySQL via Drizzle ORM.
- **Desktop Backend:** Tauri 2 (Rust), SQLite via `rusqlite`.
- **Package Manager:** pnpm 10.28.2 (enforced).

## 3. Project Structure

```text
src/
├── components/         # UI Components (React and Astro)
│   ├── dashboard/      # MetricCard, DateFilter, DashboardDesktop, RecentTable
│   ├── history/        # HistoryTable, HistoryDesktop
│   ├── register/       # RegisterForm
│   ├── settings/       # SettingsForm, SettingsDesktop
│   ├── layout/         # Navbar
│   └── ui/             # Button, Card, Table, Tooltip, DownloadButton
├── db/                 # Database Layer (web only)
│   ├── client.ts       # Drizzle/MySQL connection client
│   └── schema.ts       # Database schema definition
├── lib/
│   └── database.ts     # Runtime abstraction (web API ↔ Tauri IPC)
├── layouts/            # MainLayout (shared)
├── pages/              # Web routes (SSR)
│   ├── api/            # REST endpoints (records, records/[id], settings)
│   ├── index.astro     # Dashboard
│   ├── register.astro  # Registration form
│   ├── history.astro   # Historical view
│   ├── settings.astro  # Settings + export
│   └── guia.astro      # Metrics guide
├── pages-desktop/      # Desktop routes (static, client:only)
│   ├── index.astro     # Dashboard
│   ├── register.astro  # Registration form
│   ├── history.astro   # Historical view
│   ├── settings.astro  # Settings + export
│   └── guia.astro      # Metrics guide
├── stores/             # Zustand (useDateFilterStore)
└── utils/              # Data interfaces, processing, CSV export, settings helpers

src-tauri/
├── src/lib.rs          # Rust backend: SQLite CRUD + Tauri IPC commands
├── tauri.conf.json     # Tauri app configuration
└── Cargo.toml          # Rust dependencies
```

## 4. Data Model

### Database Schema (`body_metrics`)

16 columns of body composition data plus metadata:

| Field | Description |
|-------|-------------|
| `weight` | Body weight (kg) |
| `bmi` | Body Mass Index |
| `fat_mass_kg` / `fat_mass_percent` | Fat mass in kg and percentage |
| `muscle_mass_kg` | Skeletal + smooth muscle mass |
| `free_mass_kg` | Fat-free mass (muscle + bone + water + organs) |
| `water_kg` / `water_percent` | Total body water |
| `bone_mass_kg` | Bone mineral mass |
| `visceral_fat` | Visceral fat index (1-59 scale) |
| `bmr` | Basal Metabolic Rate (kcal) |
| `metabolic_age` | Metabolic age comparison |
| `phase_angle` | Cellular health indicator (degrees) |
| `resistance` / `reactance` | Bioimpedance raw values |

### Settings (`app_settings`)

Key-value store for user preferences. Currently stores `userName`.

### Internal Interface (`RegistroCorporal`)

The data processor transforms DB records to a TypeScript interface mapping column names to PascalCase properties (e.g., `recorded_at` → `Fecha`, `fat_mass_kg` → `GrasaKg`).

## 5. Main Business Logic

### Runtime Abstraction (`src/lib/database.ts`)

All data operations pass through this module, which auto-detects the runtime:
- **Web:** Routes to `/api/records` and `/api/settings` endpoints
- **Desktop:** Invokes Tauri IPC commands (`create_record`, `get_setting`, etc.)

Functions: `createRecord()`, `updateRecord()`, `deleteRecord()`, `getAllRecords()`, `getSetting()`, `setSetting()`, `getAllSettings()`

### Data Processing (`src/utils/dataProcessor.ts`)
1. **Reading:** Drizzle ORM queries (web) or Tauri IPC (desktop)
2. **Mapping:** `mapDbRecordToUi` converts DB records to `RegistroCorporal`
3. **Delta Calculation:** `getLastRecordWithDelta()` computes absolute differences between last two records

### API Endpoints (web only, `src/pages/api/`)
- `POST /api/records` — Create record
- `PUT /api/records/[id]` — Update record
- `DELETE /api/records/[id]` — Delete record
- `GET /api/settings?key=NAME` — Get setting
- `PUT /api/settings` — Upsert setting

### CSV Export (`src/utils/export.ts`)
- Generates CSV with Spanish headers
- Web: triggers browser download via Blob URL
- Desktop: opens native save dialog via `tauri-plugin-dialog`, writes file via `save_csv_file` IPC command

## 6. Development Considerations

- **Rendering:** Web pages use SSR (`client:load` for interactive islands). Desktop pages use static rendering (`client:only="react"` — all data loading happens client-side).
- **Database:** Web requires a running MySQL instance (`.env` → `DATABASE_URL`). Desktop auto-initializes SQLite on first launch.
- **Build:** Desktop build requires a page-swap step (`scripts/build-desktop.sh`) that temporarily replaces `src/pages/` with `src/pages-desktop/`.
- **Styling:** Dark theme with emerald accents, consistent across both targets.
- **Localization:** All UI text is in Spanish (es-ES).
