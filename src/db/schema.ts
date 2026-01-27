import { mysqlTable, int, decimal, date, timestamp, tinyint, varchar } from 'drizzle-orm/mysql-core';

// Tabla de configuraciones de la aplicación
export const appSettings = mysqlTable('app_settings', {
  id: int('id').autoincrement().primaryKey(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  value: varchar('value', { length: 255 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const bodyMetrics = mysqlTable('body_metrics', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').default(1),
  recordedAt: date('recorded_at').notNull(),
  
  // Métricas Principales
  weight: decimal('weight', { precision: 5, scale: 2 }).notNull(),
  bmi: decimal('bmi', { precision: 4, scale: 1 }),
  fatMassKg: decimal('fat_mass_kg', { precision: 5, scale: 2 }),
  fatMassPercent: decimal('fat_mass_percent', { precision: 4, scale: 1 }),
  muscleMassKg: decimal('muscle_mass_kg', { precision: 5, scale: 2 }),
  freeMassKg: decimal('free_mass_kg', { precision: 5, scale: 2 }),
  
  // Métricas de Composición
  waterKg: decimal('water_kg', { precision: 5, scale: 2 }),
  waterPercent: decimal('water_percent', { precision: 4, scale: 1 }),
  boneMassKg: decimal('bone_mass_kg', { precision: 4, scale: 2 }),
  visceralFat: decimal('visceral_fat', { precision: 4, scale: 1 }),
  
  // Metabolismo
  bmr: decimal('bmr', { precision: 6, scale: 2 }),
  metabolicAge: tinyint('metabolic_age'),
  
  // Bioimpedancia (Avanzado)
  phaseAngle: decimal('phase_angle', { precision: 4, scale: 2 }),
  resistance: decimal('resistance', { precision: 6, scale: 2 }),
  reactance: decimal('reactance', { precision: 6, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow()
});
