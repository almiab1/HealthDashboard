import { type RegistroCorporal } from "./data";
import { db } from "../db/client";
import { bodyMetrics } from "../db/schema";
import { asc } from "drizzle-orm";

export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

// Helper to convert DB record to UI interface
function mapDbRecordToUi(
  record: typeof bodyMetrics.$inferSelect,
): RegistroCorporal {
  // Asegurarse de que record.recordedAt se interpreta correctamente como fecha local
  let dateObj: Date;

  if (record.recordedAt instanceof Date) {
    dateObj = record.recordedAt;
  } else {
    // Si es string, parseamos
    const dateStr = String(record.recordedAt);
    if (dateStr.includes("T")) {
      dateObj = new Date(dateStr);
    } else {
      // Asumir YYYY-MM-DD
      const [y, m, d] = dateStr.split("-").map(Number);
      // Crear fecha al mediodía para evitar problemas de TZ
      dateObj = new Date(y, m - 1, d, 12, 0, 0);
    }
  }

  return {
    id: record.id,
    Fecha: dateObj,
    Peso: Number(record.weight),
    IMC: Number(record.bmi),
    GrasaKg: Number(record.fatMassKg),
    GrasaPorc: Number(record.fatMassPercent),
    MasaLibreKg: Number(record.freeMassKg),
    MusculoKg: Number(record.muscleMassKg),
    AguaKg: Number(record.waterKg),
    AguaPorc: Number(record.waterPercent),
    MetabolismoBasal: Number(record.bmr),
    EdadMetabolica: Number(record.metabolicAge),
    GrasaVisceral: Number(record.visceralFat),
    MasaOsea: Number(record.boneMassKg),
    AnguloFase: Number(record.phaseAngle),
    Resistencia: Number(record.resistance),
    Reactancia: Number(record.reactance),
  };
}

export async function getProcessedData(): Promise<RegistroCorporal[]> {
  try {
    const records = await db
      .select()
      .from(bodyMetrics)
      .orderBy(asc(bodyMetrics.recordedAt));
    return records.map(mapDbRecordToUi);
  } catch (error) {
    console.error("Error fetching data from DB:", error);
    return [];
  }
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
  };
}

export async function getLastRecordWithDelta(): Promise<DataWithDelta | null> {
  const data = await getProcessedData();
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
      MetabolismoBasal: Number(
        (last.MetabolismoBasal - previous.MetabolismoBasal).toFixed(0),
      ),
      EdadMetabolica: Number(
        (last.EdadMetabolica - previous.EdadMetabolica).toFixed(0),
      ),
      GrasaVisceral: Number(
        (last.GrasaVisceral - previous.GrasaVisceral).toFixed(0),
      ),
      MasaOsea: Number((last.MasaOsea - previous.MasaOsea).toFixed(2)),
      AnguloFase: Number((last.AnguloFase - previous.AnguloFase).toFixed(2)),
      Resistencia: Number((last.Resistencia - previous.Resistencia).toFixed(1)),
      Reactancia: Number((last.Reactancia - previous.Reactancia).toFixed(1)),
    },
  };
}
