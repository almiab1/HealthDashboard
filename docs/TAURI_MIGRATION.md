# Tauri Migration - Phase 2: Database

## Current State

The application uses:
- **Database:** MySQL (via `mysql2/promise`)
- **ORM:** Drizzle ORM with `drizzle-orm/mysql-core`
- **Affected files:**
  - `src/db/client.ts` - MySQL connection
  - `src/db/schema.ts` - Schema with MySQL types
  - `drizzle.config.ts` - Drizzle Kit configuration

## Objective

For the offline desktop version, we need to replace MySQL with **SQLite**, which:
- Embeds within the executable (no external server)
- Data is saved in a local file (e.g., `~/.healthdashboard/data.db`)
- Works 100% without internet connection

---

## Migration Tasks

### 1. Install SQLite Dependencies

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

### 2. Create Parallel SQLite Schema

Create file `src/db/schema.desktop.ts`:

```typescript
import { sqliteTable, integer, real, text } from 'drizzle-orm/sqlite-core';

export const bodyMetrics = sqliteTable('body_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').default(1),
  recordedAt: text('recorded_at').notNull(), // SQLite has no native DATE type
  
  // Main Metrics (real = FLOAT in SQLite)
  weight: real('weight').notNull(),
  bmi: real('bmi'),
  fatMassKg: real('fat_mass_kg'),
  fatMassPercent: real('fat_mass_percent'),
  muscleMassKg: real('muscle_mass_kg'),
  freeMassKg: real('free_mass_kg'),
  
  // Composition Metrics
  waterKg: real('water_kg'),
  waterPercent: real('water_percent'),
  boneMassKg: real('bone_mass_kg'),
  visceralFat: real('visceral_fat'),
  
  // Metabolism
  bmr: real('bmr'),
  metabolicAge: integer('metabolic_age'),
  
  // Bioimpedance (Advanced)
  phaseAngle: real('phase_angle'),
  resistance: real('resistance'),
  reactance: real('reactance'),
  
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});
```

### 3. Create SQLite Client for Desktop

Create file `src/db/client.desktop.ts`:

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.desktop';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

// Determine database path
const dataDir = join(homedir(), '.healthdashboard');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'data.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

// Create table if it doesn't exist (first run)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS body_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    recorded_at TEXT NOT NULL,
    weight REAL NOT NULL,
    bmi REAL,
    fat_mass_kg REAL,
    fat_mass_percent REAL,
    muscle_mass_kg REAL,
    free_mass_kg REAL,
    water_kg REAL,
    water_percent REAL,
    bone_mass_kg REAL,
    visceral_fat REAL,
    bmr REAL,
    metabolic_age INTEGER,
    phase_angle REAL,
    resistance REAL,
    reactance REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
```

### 4. Create drizzle.config.desktop.ts

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.desktop.ts",
  out: "./drizzle-desktop",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data.db", // For local migrations
  },
});
```

### 5. Move API Logic to Client (React)

**Problem:** Files in `src/pages/api/` only work with a Node.js server.

**Solution:** Create a data module that works directly in the frontend.

Create `src/lib/database.desktop.ts`:

```typescript
// This file is only used in the desktop version
// Uses Tauri to access the file system

import { invoke } from '@tauri-apps/api/core';

export interface BodyMetric {
  id: number;
  recordedAt: string;
  weight: number;
  bmi: number | null;
  // ... rest of fields
}

// Calls to Tauri Rust commands
export async function getAllRecords(): Promise<BodyMetric[]> {
  return await invoke('get_all_records');
}

export async function createRecord(data: Omit<BodyMetric, 'id'>): Promise<void> {
  await invoke('create_record', { data });
}

export async function deleteRecord(id: number): Promise<void> {
  await invoke('delete_record', { id });
}

export async function updateRecord(id: number, data: Partial<BodyMetric>): Promise<void> {
  await invoke('update_record', { id, data });
}
```

### 6. Implement Tauri Commands (Rust)

In `src-tauri/src/main.rs`, add commands for SQLite:

```rust
use rusqlite::{Connection, params};
use tauri::State;
use std::sync::Mutex;

struct DbConnection(Mutex<Connection>);

#[tauri::command]
fn get_all_records(db: State<DbConnection>) -> Result<Vec<BodyMetric>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    // ... implement query
}

#[tauri::command]
fn create_record(db: State<DbConnection>, data: BodyMetric) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    // ... implement insert
}

// ... more commands
```

---

## Key Differences MySQL vs SQLite

| Aspect | MySQL | SQLite |
|---------|-------|--------|
| `DECIMAL` Type | `decimal(5,2)` | `real` (FLOAT) |
| `DATE` Type | Native | `text` (ISO string) |
| `TIMESTAMP` Type | Native | `text` |
| `TINYINT` Type | Native | `integer` |
| Auto-increment | `autoincrement()` | `autoIncrement: true` |
| Connection | Connection pool | Single file |

---

## Conditional Imports Strategy

To maintain both versions, use dynamic imports:

```typescript
// src/lib/getDatabase.ts
export async function getDatabase() {
  if (import.meta.env.TAURI) {
    // Desktop version - uses Tauri commands
    return await import('./database.desktop');
  } else {
    // Web version - uses API routes
    return await import('./database.web');
  }
}
```

---

## Next Steps

1. [ ] Install `better-sqlite3` and types
2. [ ] Create `schema.desktop.ts` and `client.desktop.ts`
3. [ ] Implement Tauri commands in Rust
4. [ ] Create database wrapper for frontend
5. [ ] Test with `npm run tauri dev`
6. [ ] Implement data migration (export MySQL → import SQLite)

---

## System Requirements for Development

To compile the desktop app you need:

### Windows
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [Rust](https://rustup.rs/)

### macOS
- Xcode Command Line Tools: `xcode-select --install`
- [Rust](https://rustup.rs/)

### Linux (Debian/Ubuntu)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
