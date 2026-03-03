import type { APIRoute } from 'astro';
import { db } from '../../db/client';
import { appSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

// GET: Obtener una configuración por key
// Ejemplo: /api/settings?key=userName
export const GET: APIRoute = async ({ url }) => {
  try {
    const key = url.searchParams.get('key');
    
    if (!key) {
      return new Response(
        JSON.stringify({ error: 'El parámetro "key" es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    
    if (result.length === 0) {
      return new Response(
        JSON.stringify({ key, value: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ key: result[0].key, value: result[0].value }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error al obtener configuración:', error);
    return new Response(
      JSON.stringify({ error: `Error al obtener configuración: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT: Crear o actualizar una configuración
// Body: { key: string, value: string }
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    if (!body.key || body.value === undefined) {
      return new Response(
        JSON.stringify({ error: 'Los campos "key" y "value" son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si ya existe
    const existing = await db.select().from(appSettings).where(eq(appSettings.key, body.key)).limit(1);
    
    if (existing.length > 0) {
      // Actualizar
      await db.update(appSettings)
        .set({ value: body.value })
        .where(eq(appSettings.key, body.key));
    } else {
      // Insertar nuevo
      await db.insert(appSettings).values({
        key: body.key,
        value: body.value
      });
    }

    return new Response(
      JSON.stringify({ success: true, key: body.key, value: body.value }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error al guardar configuración:', error);
    return new Response(
      JSON.stringify({ error: `Error al guardar configuración: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
