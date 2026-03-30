// ABOUTME: Script de migración one-way: SQLite (Tauri/desktop) → MySQL (web)
// ABOUTME: Lee todos los registros del SQLite local y los upserta en MySQL, usando recorded_at como clave

import Database from 'better-sqlite3';
import { db } from '../src/db/client';
import { bodyMetrics } from '../src/db/schema';
import { sql } from 'drizzle-orm';
import os from 'node:os';
import path from 'node:path';
import 'dotenv/config';

interface SqliteRecord {
  id: number;
  recorded_at: string;
  weight: number;
  bmi: number | null;
  fat_mass_kg: number | null;
  fat_mass_percent: number | null;
  muscle_mass_kg: number | null;
  free_mass_kg: number | null;
  water_kg: number | null;
  water_percent: number | null;
  bone_mass_kg: number | null;
  visceral_fat: number | null;
  bmr: number | null;
  metabolic_age: number | null;
  phase_angle: number | null;
  resistance: number | null;
  reactance: number | null;
}

function getSqliteDbPath(): string {
  const platform = process.platform;
  let dataDir: string;

  if (platform === 'linux') {
    dataDir = path.join(os.homedir(), '.local', 'share', 'healthdashboard');
  } else if (platform === 'darwin') {
    dataDir = path.join(os.homedir(), 'Library', 'Application Support', 'healthdashboard');
  } else if (platform === 'win32') {
    dataDir = path.join(process.env.APPDATA ?? os.homedir(), 'healthdashboard');
  } else {
    throw new Error(`Plataforma no soportada: ${platform}`);
  }

  return path.join(dataDir, 'data.db');
}

async function sync() {
  const dbPath = getSqliteDbPath();
  console.log(`[sync] Leyendo SQLite desde: ${dbPath}`);

  const sqlite = new Database(dbPath, { readonly: true });
  const rows = sqlite.prepare('SELECT * FROM body_metrics ORDER BY recorded_at ASC').all() as SqliteRecord[];
  sqlite.close();

  console.log(`[sync] ${rows.length} registros encontrados en SQLite`);
  if (rows.length === 0) {
    console.log('[sync] No hay datos en SQLite. Abortando.');
    process.exit(0);
  }

  // Truncar MySQL y reinsertar todo desde SQLite (Tauri es la fuente de verdad)
  console.log('[sync] Truncando tabla body_metrics en MySQL...');
  await db.execute(sql`TRUNCATE TABLE body_metrics`);

  const toInsert = rows.map((row) => ({
    // recordedAt espera un Date para Drizzle MySQL
    recordedAt: new Date(row.recorded_at + 'T12:00:00Z'),
    weight: String(row.weight),
    bmi: row.bmi != null ? String(row.bmi) : null,
    fatMassKg: row.fat_mass_kg != null ? String(row.fat_mass_kg) : null,
    fatMassPercent: row.fat_mass_percent != null ? String(row.fat_mass_percent) : null,
    muscleMassKg: row.muscle_mass_kg != null ? String(row.muscle_mass_kg) : null,
    freeMassKg: row.free_mass_kg != null ? String(row.free_mass_kg) : null,
    waterKg: row.water_kg != null ? String(row.water_kg) : null,
    waterPercent: row.water_percent != null ? String(row.water_percent) : null,
    boneMassKg: row.bone_mass_kg != null ? String(row.bone_mass_kg) : null,
    visceralFat: row.visceral_fat != null ? String(row.visceral_fat) : null,
    bmr: row.bmr != null ? String(row.bmr) : null,
    metabolicAge: row.metabolic_age,
    phaseAngle: row.phase_angle != null ? String(row.phase_angle) : null,
    resistance: row.resistance != null ? String(row.resistance) : null,
    reactance: row.reactance != null ? String(row.reactance) : null,
  }));

  // Insertar en lotes de 100
  const BATCH_SIZE = 100;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    await db.insert(bodyMetrics).values(batch);
    inserted += batch.length;
    console.log(`[sync] Insertados ${inserted}/${toInsert.length}...`);
  }

  console.log(`[sync] ✓ Sincronización completa. ${inserted} registros en MySQL.`);
  process.exit(0);
}

sync().catch((err) => {
  console.error('[sync] Error fatal:', err);
  process.exit(1);
});
