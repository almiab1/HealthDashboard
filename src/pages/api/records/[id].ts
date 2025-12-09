import type { APIRoute } from 'astro';
import { db } from '../../../db/client';
import { bodyMetrics } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const recordId = parseInt(id);
    if (isNaN(recordId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db.delete(bodyMetrics).where(eq(bodyMetrics.id, recordId));

    return new Response(
      JSON.stringify({ success: true, message: 'Record deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting record:', error);
    return new Response(
      JSON.stringify({ error: 'Error processing request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const recordId = parseInt(id);
    if (isNaN(recordId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();

    // Validations similar to POST
    if (!body.date || !body.weight) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: date and weight are mandatory' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

    const [day, month, year] = body.date.split('/').map(Number);
    const recordedAt = new Date(year, month - 1, day);

    const updateData = {
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

    await db.update(bodyMetrics)
      .set(updateData)
      .where(eq(bodyMetrics.id, recordId));

    return new Response(
      JSON.stringify({ success: true, message: 'Record updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating record:', error);
    return new Response(
      JSON.stringify({ error: 'Error processing request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

