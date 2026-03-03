/**
 * Wrapper de Base de Datos - Detecta automáticamente el entorno
 * 
 * - En Tauri (desktop): usa comandos nativos de Rust via invoke()
 * - En Web (servidor): usa las rutas API de Astro (/api/records)
 */

import type { RegistroCorporal } from '../utils/data';

// Interfaz para datos de entrada (formulario)
export interface RecordInput {
  date: string;
  weight: string;
  bmi?: string;
  fatMassKg?: string;
  fatMassPercent?: string;
  fatFreeMass?: string;
  muscleMass?: string;
  totalBodyWaterKg?: string;
  totalBodyWaterPercent?: string;
  basalMetabolicRate?: string;
  metabolicAge?: string;
  visceralFat?: string;
  boneMineralMass?: string;
  phaseAngle?: string;
  resistance?: string;
  reactance?: string;
}

// Interfaz que coincide con Rust (BodyMetric en lib.rs)
interface TauriBodyMetric {
  id?: number;
  recordedAt: string;
  weight: number;
  bmi: number | null;
  fatMassKg: number | null;
  fatMassPercent: number | null;
  muscleMassKg: number | null;
  freeMassKg: number | null;
  waterKg: number | null;
  waterPercent: number | null;
  boneMassKg: number | null;
  visceralFat: number | null;
  bmr: number | null;
  metabolicAge: number | null;
  phaseAngle: number | null;
  resistance: number | null;
  reactance: number | null;
}

// Detectar si estamos en Tauri
function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
    __TAURI_IPC__?: unknown;
    __TAURI_INVOKE__?: unknown;
  };
  return Boolean(w.__TAURI__ || w.__TAURI_INTERNALS__ || w.__TAURI_IPC__ || w.__TAURI_INVOKE__);
}

async function tryInvokeTauri<T>(command: string, payload: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, payload);
}

// Convertir fecha DD/MM/YYYY a YYYY-MM-DD (formato ISO para SQLite)
function dateToISO(dateStr: string): string {
  const [day, month, year] = dateStr.split('/').map(Number);
  // Asegurar formato YYYY-MM-DD con padding
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Convertir fecha ISO a DD/MM/YYYY
function isoToDate(isoStr: string): Date {
    // Si viene como string ISO completo (con T), tomamos solo la parte de la fecha
    const cleanIso = isoStr.split('T')[0]; 
    const [year, month, day] = cleanIso.split('-').map(Number);
    // Devolver fecha al mediodía para evitar cambios de día por zona horaria local
    return new Date(year, month - 1, day, 12, 0, 0);
}

// Convertir RecordInput a TauriBodyMetric
function inputToTauriMetric(input: RecordInput): TauriBodyMetric {
  return {
    recordedAt: dateToISO(input.date),
    weight: parseFloat(input.weight),
    bmi: input.bmi ? parseFloat(input.bmi) : null,
    fatMassKg: input.fatMassKg ? parseFloat(input.fatMassKg) : null,
    fatMassPercent: input.fatMassPercent ? parseFloat(input.fatMassPercent) : null,
    muscleMassKg: input.muscleMass ? parseFloat(input.muscleMass) : null,
    freeMassKg: input.fatFreeMass ? parseFloat(input.fatFreeMass) : null,
    waterKg: input.totalBodyWaterKg ? parseFloat(input.totalBodyWaterKg) : null,
    waterPercent: input.totalBodyWaterPercent ? parseFloat(input.totalBodyWaterPercent) : null,
    boneMassKg: input.boneMineralMass ? parseFloat(input.boneMineralMass) : null,
    visceralFat: input.visceralFat ? parseFloat(input.visceralFat) : null,
    bmr: input.basalMetabolicRate ? parseFloat(input.basalMetabolicRate) : null,
    metabolicAge: input.metabolicAge ? parseInt(input.metabolicAge) : null,
    phaseAngle: input.phaseAngle ? parseFloat(input.phaseAngle) : null,
    resistance: input.resistance ? parseFloat(input.resistance) : null,
    reactance: input.reactance ? parseFloat(input.reactance) : null,
  };
}

// Convertir TauriBodyMetric a RegistroCorporal (para el UI)
function tauriMetricToRegistro(metric: TauriBodyMetric): RegistroCorporal {
  return {
    id: metric.id!,
    Fecha: isoToDate(metric.recordedAt),
    Peso: metric.weight,
    IMC: metric.bmi ?? 0,
    GrasaKg: metric.fatMassKg ?? 0,
    GrasaPorc: metric.fatMassPercent ?? 0,
    MasaLibreKg: metric.freeMassKg ?? 0,
    MusculoKg: metric.muscleMassKg ?? 0,
    AguaKg: metric.waterKg ?? 0,
    AguaPorc: metric.waterPercent ?? 0,
    MetabolismoBasal: metric.bmr ?? 0,
    EdadMetabolica: metric.metabolicAge ?? 0,
    GrasaVisceral: metric.visceralFat ?? 0,
    MasaOsea: metric.boneMassKg ?? 0,
    AnguloFase: metric.phaseAngle ?? 0,
    Resistencia: metric.resistance ?? 0,
    Reactancia: metric.reactance ?? 0,
  };
}

// ============ API PÚBLICA ============

/**
 * Crear un nuevo registro
 */
export async function createRecord(data: RecordInput): Promise<{ success: boolean; error?: string }> {
  const tauriDetected = isTauri();
  console.log('[DB] createRecord llamado. isTauri():', tauriDetected);
  console.log('[DB] window.__TAURI__:', typeof window !== 'undefined' ? (window as any).__TAURI__ : 'N/A');
  console.log('[DB] window.__TAURI_INTERNALS__:', typeof window !== 'undefined' ? (window as any).__TAURI_INTERNALS__ : 'N/A');
  
  if (tauriDetected) {
    console.log('[DB] Usando Tauri para guardar...');
    try {
      const metric = inputToTauriMetric(data);
      console.log('[DB] Métrica a guardar:', metric);
      await tryInvokeTauri('create_record', { data: metric });
      console.log('[DB] Guardado exitoso en Tauri!');
      return { success: true };
    } catch (error) {
      console.error('[DB] Error en Tauri invoke:', error);
      return { success: false, error: String(error) };
    }
  }
  
  // Versión Web - usar API de Astro
  console.log('[DB] Usando API Web para guardar...');
  try {
    const response = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    console.log('[DB] Respuesta API:', response.status, result);
    if (response.ok) {
      return { success: true };
    }
    return { success: false, error: result.error || 'Error al guardar' };
  } catch (error) {
    console.error('[DB] Error en fetch:', error);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
}

/**
 * Actualizar un registro existente
 */
export async function updateRecord(id: number, data: RecordInput): Promise<{ success: boolean; error?: string }> {
  if (isTauri()) {
    try {
      const metric = inputToTauriMetric(data);
      await tryInvokeTauri('update_record', { id, data: metric });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  try {
    const response = await fetch(`/api/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (response.ok) {
      return { success: true };
    }
    return { success: false, error: result.error || 'Error al actualizar' };
  } catch (error) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
}

/**
 * Eliminar un registro
 */
export async function deleteRecord(id: number): Promise<{ success: boolean; error?: string }> {
  if (isTauri()) {
    try {
      await tryInvokeTauri('delete_record', { id });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  try {
    const response = await fetch(`/api/records/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      return { success: true };
    }
    const result = await response.json();
    return { success: false, error: result.error || 'Error al eliminar' };
  } catch (error) {
    return { success: false, error: 'Error de conexión' };
  }
}

/**
 * Obtener todos los registros (solo útil en Tauri, en web se usa SSR)
 */
export async function getAllRecords(): Promise<RegistroCorporal[]> {
  const tauriDetected = isTauri();
  console.log('[DB] getAllRecords llamado. isTauri():', tauriDetected);
  
  if (tauriDetected) {
    console.log('[DB] Leyendo registros desde Tauri...');
    try {
      const records = await tryInvokeTauri<TauriBodyMetric[]>('get_all_records', {});
      console.log('[DB] Registros obtenidos de Tauri:', records.length);
      return records.map(tauriMetricToRegistro);
    } catch (error) {
      console.error('[DB] Error leyendo de Tauri:', error);
      return [];
    }
  }
  
  // En web, esto normalmente se hace con SSR en las páginas Astro
  console.warn('[DB] getAllRecords() en modo web - devolviendo []');
  return [];
}

/**
 * Obtener un valor de configuración por clave
 */
export async function getSetting(key: string): Promise<string | null> {
  if (isTauri()) {
    try {
      const value = await tryInvokeTauri<string | null>('get_setting', { key });
      return value;
    } catch (error) {
      console.error('[DB] Error getting setting from Tauri:', error);
      return null;
    }
  }

  try {
    const response = await fetch(`/api/settings?key=${encodeURIComponent(key)}`);
    const data = await response.json();
    return data.value ?? null;
  } catch (error) {
    console.error('[DB] Error getting setting from API:', error);
    return null;
  }
}

/**
 * Guardar un valor de configuración
 */
export async function setSetting(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  if (isTauri()) {
    try {
      await tryInvokeTauri('set_setting', { key, value });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  try {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    if (response.ok) {
      return { success: true };
    }
    const result = await response.json();
    return { success: false, error: result.error || 'Error al guardar configuración' };
  } catch (error) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
}

/**
 * Obtener todas las configuraciones
 */
export async function getAllSettings(): Promise<Array<{ key: string; value: string }>> {
  if (isTauri()) {
    try {
      return await tryInvokeTauri<Array<{ key: string; value: string }>>('get_all_settings', {});
    } catch (error) {
      console.error('[DB] Error getting all settings from Tauri:', error);
      return [];
    }
  }

  // Web mode doesn't have a get-all endpoint, return empty
  return [];
}

/**
 * Verificar si estamos en modo desktop (Tauri)
 */
export function isDesktopMode(): boolean {
  return isTauri();
}
