import { db } from '../db/client';
import { appSettings } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Obtiene un valor de configuración de la base de datos
 * @param key - La clave de la configuración
 * @param defaultValue - Valor por defecto si no existe
 * @returns El valor de la configuración o el valor por defecto
 */
export async function getSettingValue(key: string, defaultValue: string = ''): Promise<string> {
  try {
    const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return result.length > 0 ? result[0].value : defaultValue;
  } catch (error) {
    console.error(`Error al obtener configuración "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Guarda un valor de configuración en la base de datos
 * @param key - La clave de la configuración
 * @param value - El valor a guardar
 */
export async function setSettingValue(key: string, value: string): Promise<void> {
  try {
    const existing = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    
    if (existing.length > 0) {
      await db.update(appSettings)
        .set({ value })
        .where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value });
    }
  } catch (error) {
    console.error(`Error al guardar configuración "${key}":`, error);
    throw error;
  }
}
