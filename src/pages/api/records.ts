import type { APIRoute } from 'astro';
import { db } from '../../db/client';
import { bodyMetrics } from '../../db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validar que se reciban los datos necesarios
    if (!body.date || !body.weight) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: date y weight son obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse date DD/MM/YYYY to Date object for DB
    const [day, month, year] = body.date.split('/').map(Number);
    const recordedAt = new Date(year, month - 1, day);

    // Preparar el objeto para insertar
    const newRecord = {
      recordedAt: recordedAt,
      weight: parseFloat(body.weight),
      bmi: body.bmi ? parseFloat(body.bmi) : null,
      fatMassKg: body.fatMassKg ? parseFloat(body.fatMassKg) : null,
      fatMassPercent: body.fatMassPercent ? parseFloat(body.fatMassPercent) : null,
      freeMassKg: body.fatFreeMass ? parseFloat(body.fatFreeMass) : null,
      muscleMassKg: body.muscleMass ? parseFloat(body.muscleMass) : null,
      waterKg: body.totalBodyWaterKg ? parseFloat(body.totalBodyWaterKg) : null,
      waterPercent: body.totalBodyWaterPercent ? parseFloat(body.totalBodyWaterPercent) : null,
      bmr: body.basalMetabolicRate ? parseFloat(body.basalMetabolicRate) : null,
      metabolicAge: body.metabolicAge ? parseInt(body.metabolicAge) : null,
      visceralFat: body.visceralFat ? parseFloat(body.visceralFat) : null,
      boneMassKg: body.boneMineralMass ? parseFloat(body.boneMineralMass) : null,
      phaseAngle: body.phaseAngle ? parseFloat(body.phaseAngle) : null,
      resistance: body.resistance ? parseFloat(body.resistance) : null,
      reactance: body.reactance ? parseFloat(body.reactance) : null
    };

    // Insertar en la base de datos
    await db.insert(bodyMetrics).values(newRecord);

    return new Response(
      JSON.stringify({ success: true, message: 'Registro guardado exitosamente' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error al guardar el registro:', error);
    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
