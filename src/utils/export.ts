import type { RegistroCorporal } from './data';

/**
 * Converts an array of body metric records to CSV format.
 * Headers are in Spanish to match the application's language.
 */
export function convertRecordsToCSV(data: RegistroCorporal[]): string {
  const headers = [
    'Fecha',
    'Peso (kg)',
    'IMC',
    'Grasa (kg)',
    'Grasa (%)',
    'Masa Libre (kg)',
    'Músculo (kg)',
    'Agua (kg)',
    'Agua (%)',
    'Metabolismo Basal',
    'Edad Metabólica',
    'Grasa Visceral',
    'Masa Ósea (kg)',
    'Ángulo de Fase',
    'Resistencia',
    'Reactancia'
  ];

  const rows = data.map(record => {
    const fecha = record.Fecha instanceof Date 
      ? record.Fecha.toLocaleDateString('es-ES')
      : new Date(record.Fecha).toLocaleDateString('es-ES');
    
    return [
      fecha,
      record.Peso,
      record.IMC,
      record.GrasaKg,
      record.GrasaPorc,
      record.MasaLibreKg,
      record.MusculoKg,
      record.AguaKg,
      record.AguaPorc,
      record.MetabolismoBasal,
      record.EdadMetabolica,
      record.GrasaVisceral,
      record.MasaOsea,
      record.AnguloFase,
      record.Resistencia,
      record.Reactancia
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Check if running in Tauri environment (robust detection)
 */
function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as { 
    __TAURI__?: unknown; 
    __TAURI_INTERNALS__?: unknown;
    __TAURI_IPC__?: unknown;
  };
  return Boolean(w.__TAURI__ || w.__TAURI_INTERNALS__ || w.__TAURI_IPC__);
}

/**
 * Downloads CSV file - uses Tauri save dialog if in desktop app, otherwise browser download
 * Returns the file path if saved via Tauri, null if cancelled or browser download
 */
export async function downloadCSV(content: string, filename: string): Promise<string | null> {
  console.log('[Export] isTauri:', isTauri());
  
  if (isTauri()) {
    try {
      // Use Tauri dialog to let user choose where to save
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { invoke } = await import('@tauri-apps/api/core');
      
      console.log('[Export] Opening save dialog...');
      
      // Show save dialog
      const filePath = await save({
        defaultPath: filename,
        filters: [{
          name: 'CSV',
          extensions: ['csv']
        }]
      });
      
      console.log('[Export] Dialog result:', filePath);
      
      if (filePath) {
        // User selected a path, save the file
        await invoke('save_csv_file', { content, filename: filePath });
        return filePath;
      }
      
      // User cancelled
      return null;
    } catch (error) {
      console.error('[Export] Error with Tauri dialog:', error);
      throw error;
    }
  } else {
    // Browser download
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return null;
  }
}
