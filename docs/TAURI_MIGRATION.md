# Tauri Desktop Implementation

## Status: Complete

The desktop version is fully implemented using Tauri 2 with a Rust backend and embedded SQLite database.

## Architecture

The desktop app reuses the Astro + React frontend as a static build, with a Rust backend handling all data operations via Tauri IPC.

```
┌──────────────────────────────────────┐
│          Tauri Window (WebView)       │
│  ┌─────────────────────────────────┐ │
│  │  Static Astro + React Frontend  │ │
│  │  (dist-desktop/)                │ │
│  │                                 │ │
│  │  database.ts → invoke()  ───────┼─┼──→ Tauri IPC
│  └─────────────────────────────────┘ │      │
│                                      │      ▼
│  ┌─────────────────────────────────┐ │  lib.rs (Rust)
│  │  Rust Backend                   │ │    │
│  │  - SQLite via rusqlite          │ │    ▼
│  │  - CRUD commands                │ │  data.db (SQLite)
│  │  - File I/O (CSV export)        │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Rust Backend (`src-tauri/src/lib.rs`)

### Database Initialization

On first launch, `init_database()`:
1. Resolves the user data directory via `dirs::data_dir()`
2. Creates `healthdashboard/` subdirectory if needed
3. Opens/creates `data.db` SQLite file
4. Creates `body_metrics` and `app_settings` tables if they don't exist

### Tauri Commands

All commands receive `State<DbConnection>` (a `Mutex<Connection>` for thread-safe SQLite access):

| Command | Signature | Description |
|---------|-----------|-------------|
| `get_all_records` | `() → Vec<BodyMetric>` | All records ordered by date ASC |
| `create_record` | `(data: BodyMetric) → i64` | Insert, returns row ID |
| `update_record` | `(id: i64, data: BodyMetric) → ()` | Update by ID |
| `delete_record` | `(id: i64) → ()` | Delete by ID |
| `get_record_by_id` | `(id: i64) → Option<BodyMetric>` | Single record lookup |
| `save_csv_file` | `(content: String, filename: String) → String` | Write file to disk |
| `get_setting` | `(key: String) → Option<String>` | Get config value |
| `set_setting` | `(key: String, value: String) → ()` | Upsert config (INSERT ... ON CONFLICT) |
| `get_all_settings` | `() → Vec<AppSetting>` | All settings |

### Plugins

- `tauri-plugin-dialog` — Native file save/open dialogs (used for CSV export)
- `tauri-plugin-log` — Console logging (debug builds only)

### Rust Dependencies (`Cargo.toml`)

```toml
tauri = "2.10"
rusqlite = { version = "0.32", features = ["bundled"] }  # Bundled SQLite
serde = { version = "1", features = ["derive"] }
serde_json = "1"
dirs = "5.0"
log = "0.4"
tauri-plugin-dialog = "2"
tauri-plugin-log = "2"
```

## Frontend Integration

### Runtime Detection

`src/lib/database.ts` detects Tauri by checking for injected globals:

```typescript
function isTauri(): boolean {
  return Boolean(window.__TAURI__ || window.__TAURI_INTERNALS__);
}
```

### Dynamic Import

The Tauri API is dynamically imported only when needed (avoids bundling issues in web mode):

```typescript
async function tryInvokeTauri<T>(command: string, payload: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, payload);
}
```

### Desktop-Specific Components

Desktop pages in `src/pages-desktop/` use `client:only="react"` components that load data entirely client-side:

- `DashboardDesktop` — Fetches records via `getAllRecords()`, renders MetricCards + table
- `HistoryDesktop` — Fetches records, renders editable table with sort/filter/delete
- `SettingsDesktop` — Loads settings via `getSetting()`, shows profile form + stats + CSV export

## MySQL vs SQLite Differences

| Aspect | MySQL (Web) | SQLite (Desktop) |
|--------|-------------|------------------|
| Date storage | Native `DATE` type | `TEXT` (ISO 8601 string) |
| Decimal types | `DECIMAL(p,s)` | `REAL` (64-bit float) |
| Integer types | `INT`, `TINYINT` | `INTEGER` |
| Timestamps | `TIMESTAMP DEFAULT NOW()` | `TEXT DEFAULT CURRENT_TIMESTAMP` |
| Upsert | Check + INSERT/UPDATE | `INSERT ... ON CONFLICT DO UPDATE` |
| Connection | Pool (mysql2) | Single file (Mutex-wrapped) |
| Migrations | Drizzle Kit | Auto-create on startup |

## System Requirements

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  build-essential
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### macOS
```bash
xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Windows
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C++ workload)
- [Rust](https://rustup.rs/)
