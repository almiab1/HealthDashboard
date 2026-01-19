# Migración a Tauri - Fase 2: Base de Datos

## Estado Actual

La aplicación usa:
- **Base de datos:** MySQL (via `mysql2/promise`)
- **ORM:** Drizzle ORM con `drizzle-orm/mysql-core`
- **Archivos afectados:**
  - `src/db/client.ts` - Conexión a MySQL
  - `src/db/schema.ts` - Esquema con tipos MySQL
  - `drizzle.config.ts` - Configuración de Drizzle Kit

## Objetivo

Para la versión de escritorio offline, necesitamos reemplazar MySQL por **SQLite**, que:
- Se embebe dentro del ejecutable (sin servidor externo)
- Los datos se guardan en un archivo local (ej: `~/.healthdashboard/data.db`)
- Funciona 100% sin conexión a internet

---

## Tareas de Migración

### 1. Instalar Dependencias SQLite

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

### 2. Crear Schema SQLite Paralelo

Crear archivo `src/db/schema.desktop.ts`:

```typescript
import { sqliteTable, integer, real, text } from 'drizzle-orm/sqlite-core';

export const bodyMetrics = sqliteTable('body_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').default(1),
  recordedAt: text('recorded_at').notNull(), // SQLite no tiene tipo DATE nativo
  
  // Métricas Principales (real = FLOAT en SQLite)
  weight: real('weight').notNull(),
  bmi: real('bmi'),
  fatMassKg: real('fat_mass_kg'),
  fatMassPercent: real('fat_mass_percent'),
  muscleMassKg: real('muscle_mass_kg'),
  freeMassKg: real('free_mass_kg'),
  
  // Métricas de Composición
  waterKg: real('water_kg'),
  waterPercent: real('water_percent'),
  boneMassKg: real('bone_mass_kg'),
  visceralFat: real('visceral_fat'),
  
  // Metabolismo
  bmr: real('bmr'),
  metabolicAge: integer('metabolic_age'),
  
  // Bioimpedancia (Avanzado)
  phaseAngle: real('phase_angle'),
  resistance: real('resistance'),
  reactance: real('reactance'),
  
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});
```

### 3. Crear Cliente SQLite para Desktop

Crear archivo `src/db/client.desktop.ts`:

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.desktop';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

// Determinar ruta de la base de datos
const dataDir = join(homedir(), '.healthdashboard');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'data.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

// Crear tabla si no existe (primera ejecución)
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

### 4. Crear drizzle.config.desktop.ts

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.desktop.ts",
  out: "./drizzle-desktop",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data.db", // Para migraciones locales
  },
});
```

### 5. Mover Lógica de API al Cliente (React)

**Problema:** Los archivos en `src/pages/api/` solo funcionan con un servidor Node.js.

**Solución:** Crear un módulo de datos que funcione directamente en el frontend.

Crear `src/lib/database.desktop.ts`:

```typescript
// Este archivo solo se usa en la versión desktop
// Usa Tauri para acceder al sistema de archivos

import { invoke } from '@tauri-apps/api/core';

export interface BodyMetric {
  id: number;
  recordedAt: string;
  weight: number;
  bmi: number | null;
  // ... resto de campos
}

// Llamadas a comandos Rust de Tauri
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

### 6. Implementar Comandos Tauri (Rust)

En `src-tauri/src/main.rs`, agregar comandos para SQLite:

```rust
use rusqlite::{Connection, params};
use tauri::State;
use std::sync::Mutex;

struct DbConnection(Mutex<Connection>);

#[tauri::command]
fn get_all_records(db: State<DbConnection>) -> Result<Vec<BodyMetric>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    // ... implementar query
}

#[tauri::command]
fn create_record(db: State<DbConnection>, data: BodyMetric) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    // ... implementar insert
}

// ... más comandos
```

---

## Diferencias Clave MySQL vs SQLite

| Aspecto | MySQL | SQLite |
|---------|-------|--------|
| Tipo `DECIMAL` | `decimal(5,2)` | `real` (FLOAT) |
| Tipo `DATE` | Nativo | `text` (ISO string) |
| Tipo `TIMESTAMP` | Nativo | `text` |
| Tipo `TINYINT` | Nativo | `integer` |
| Auto-increment | `autoincrement()` | `autoIncrement: true` |
| Conexión | Pool de conexiones | Archivo único |

---

## Estrategia de Imports Condicionales

Para mantener ambas versiones, usa imports dinámicos:

```typescript
// src/lib/getDatabase.ts
export async function getDatabase() {
  if (import.meta.env.TAURI) {
    // Versión desktop - usa Tauri commands
    return await import('./database.desktop');
  } else {
    // Versión web - usa API routes
    return await import('./database.web');
  }
}
```

---

## Próximos Pasos

1. [ ] Instalar `better-sqlite3` y tipos
2. [ ] Crear `schema.desktop.ts` y `client.desktop.ts`
3. [ ] Implementar comandos Tauri en Rust
4. [ ] Crear wrapper de base de datos para el frontend
5. [ ] Probar con `npm run tauri dev`
6. [ ] Implementar migración de datos (exportar MySQL → importar SQLite)

---

## Requisitos del Sistema para Desarrollo

Para compilar la app de escritorio necesitas:

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
