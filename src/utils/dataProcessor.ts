import { type RegistroCorporal, type RegistroCorporalRaw } from './data';
import fs from 'node:fs';
import path from 'node:path';

export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

// Mapping between CSV headers and internal interface keys
const CSV_MAPPING: Record<string, keyof RegistroCorporalRaw> = {
  'Date': 'Fecha',
  'Weight (kg)': 'Peso',
  'BMI': 'IMC',
  'Fat Mass (kg)': 'GrasaKg',
  'Fat Mass (%)': 'GrasaPorc',
  'Fat Free Mass (kg)': 'MasaLibreKg',
  'Muscle Mass (kg)': 'MusculoKg',
  'Total Body Water (kg)': 'AguaKg',
  'Total Body Water (%)': 'AguaPorc',
  'Basal Metabolic Rate (kcal)': 'MetabolismoBasal',
  'Metabolic Age': 'EdadMetabolica',
  'Visceral Fat Rating': 'GrasaVisceral',
  'Bone Mineral Mass (kg)': 'MasaOsea',
  'Phase Angle': 'AnguloFase',
  'Resistance (R)': 'Resistencia',
  'Reactance (Xc)': 'Reactancia'
};

function loadRawData(): RegistroCorporalRaw[] {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'registros.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const lines = fileContent.trim().split('\n');
    const headers = lines[0].trim().split(',');
    
    const data: RegistroCorporalRaw[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      const entry: any = {};
      let hasRequiredFields = true;
      
      headers.forEach((header, index) => {
        const trimmedHeader = header.trim();
        const internalKey = CSV_MAPPING[trimmedHeader];
        
        if (internalKey) {
            const value = values[index]?.trim();
            
            if (internalKey === 'Fecha') {
                entry[internalKey] = value;
            } else {
                entry[internalKey] = parseFloat(value);
            }
        }
      });

      // Basic validation
      if (!entry.Fecha || !entry.Peso) {
         console.warn(`Skipping invalid row ${i}:`, line);
         continue;
      }
      
      // Ensure all required fields exist (fill with 0 if missing to avoid crashes)
      const requiredFields: (keyof RegistroCorporalRaw)[] = [
        'Peso', 'IMC', 'GrasaKg', 'GrasaPorc', 'MasaLibreKg', 'MusculoKg',
        'AguaKg', 'AguaPorc', 'MetabolismoBasal', 'EdadMetabolica',
        'GrasaVisceral', 'MasaOsea', 'AnguloFase', 'Resistencia', 'Reactancia'
      ];
      requiredFields.forEach(field => {
          if (entry[field] === undefined || isNaN(entry[field])) {
              entry[field] = 0;
          }
      });
      
      data.push(entry as RegistroCorporalRaw);
    }
    
    return data;
  } catch (error) {
    console.error("Error reading CSV:", error);
    return [];
  }
}

export function getProcessedData(): RegistroCorporal[] {
  const rawData = loadRawData();
  return rawData.map(record => ({
    ...record,
    Fecha: parseDate(record.Fecha)
  })).sort((a, b) => a.Fecha.getTime() - b.Fecha.getTime());
}

export interface DataWithDelta extends RegistroCorporal {
  delta?: {
    Peso: number;
    IMC: number;
    GrasaKg: number;
    GrasaPorc: number;
    MasaLibreKg: number;
    MusculoKg: number;
    AguaKg: number;
    AguaPorc: number;
    MetabolismoBasal: number;
    EdadMetabolica: number;
    GrasaVisceral: number;
    MasaOsea: number;
    AnguloFase: number;
    Resistencia: number;
    Reactancia: number;
  }
}

export function getLastRecordWithDelta(): DataWithDelta | null {
  const data = getProcessedData();
  if (data.length === 0) return null;

  const last = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : null;

  if (!previous) return last;

  return {
    ...last,
    delta: {
      Peso: Number((last.Peso - previous.Peso).toFixed(2)),
      IMC: Number((last.IMC - previous.IMC).toFixed(2)),
      GrasaKg: Number((last.GrasaKg - previous.GrasaKg).toFixed(2)),
      GrasaPorc: Number((last.GrasaPorc - previous.GrasaPorc).toFixed(2)),
      MasaLibreKg: Number((last.MasaLibreKg - previous.MasaLibreKg).toFixed(2)),
      MusculoKg: Number((last.MusculoKg - previous.MusculoKg).toFixed(2)),
      AguaKg: Number((last.AguaKg - previous.AguaKg).toFixed(2)),
      AguaPorc: Number((last.AguaPorc - previous.AguaPorc).toFixed(2)),
      MetabolismoBasal: Number((last.MetabolismoBasal - previous.MetabolismoBasal).toFixed(0)),
      EdadMetabolica: Number((last.EdadMetabolica - previous.EdadMetabolica).toFixed(0)),
      GrasaVisceral: Number((last.GrasaVisceral - previous.GrasaVisceral).toFixed(0)),
      MasaOsea: Number((last.MasaOsea - previous.MasaOsea).toFixed(2)),
      AnguloFase: Number((last.AnguloFase - previous.AnguloFase).toFixed(2)),
      Resistencia: Number((last.Resistencia - previous.Resistencia).toFixed(1)),
      Reactancia: Number((last.Reactancia - previous.Reactancia).toFixed(1)),
    }
  };
}
