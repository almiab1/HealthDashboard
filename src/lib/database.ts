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
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

// Convertir fecha DD/MM/YYYY a YYYY-MM-DD (formato ISO para SQLite)
function dateToISO(dateStr: string): string {
  const [day, month, year] = dateStr.split('/').map(Number);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Convertir fecha ISO a DD/MM/YYYY
function isoToDate(isoStr: string): Date {
  const [year, month, day] = isoStr.split('-').map(Number);
  return new Date(year, month - 1, day);
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
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const metric = inputToTauriMetric(data);
      await invoke('create_record', { data: metric });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  } else {
    // Versión Web - usar API de Astro
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.ok) {
        return { success: true };
      }
      return { success: false, error: result.error || 'Error al guardar' };
    } catch (error) {
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  }
}

/**
 * Actualizar un registro existente
 */
export async function updateRecord(id: number, data: RecordInput): Promise<{ success: boolean; error?: string }> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const metric = inputToTauriMetric(data);
      await invoke('update_record', { id, data: metric });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  } else {
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
}

/**
 * Eliminar un registro
 */
export async function deleteRecord(id: number): Promise<{ success: boolean; error?: string }> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('delete_record', { id });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  } else {
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
}

/**
 * Obtener todos los registros (solo útil en Tauri, en web se usa SSR)
 */
export async function getAllRecords(): Promise<RegistroCorporal[]> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const records = await invoke<TauriBodyMetric[]>('get_all_records');
      return records.map(tauriMetricToRegistro);
    } catch (error) {
      console.error('Error obteniendo registros:', error);
      return [];
    }
  } else {
    // En web, esto normalmente se hace con SSR en las páginas Astro
    // Pero dejamos este método por si se necesita desde el cliente
    console.warn('getAllRecords() llamado en modo web - usar SSR en su lugar');
    return [];
  }
}

/**
 * Verificar si estamos en modo desktop (Tauri)
 */
export function isDesktopMode(): boolean {
  return isTauri();
}
