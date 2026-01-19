# PRD: Migración de Persistencia a MySQL - HealthDashboard

| **Documento ID** | PRD-HD-002 |
| :--- | :--- |
| **Proyecto** | HealthDashboard App |
| **Versión** | 1.0 |
| **Fecha** | 09/12/2025 |
| **Estado** | Pendiente de Implementación |
| **Autor** | Gemini (AI Assistant) |

## 1\. Resumen Ejecutivo

El objetivo de esta iniciativa es migrar la capa de persistencia de la aplicación **HealthDashboard** de un sistema basado en archivos planos (CSV) a una base de datos relacional (**MySQL**).

Actualmente, la aplicación lee y escribe directamente en `src/data/registros.csv`. Esta migración establecerá una base sólida para futuras funcionalidades (autenticación, consultas históricas complejas, rendimiento) sin alterar la experiencia de usuario actual ni la interfaz visual.

## 2\. Objetivos del Negocio

1.  **Escalabilidad:** Eliminar las limitaciones de concurrencia y tamaño de archivo del sistema CSV.
2.  **Integridad de Datos:** Asegurar tipos de datos estrictos y validación a nivel de base de datos.
3.  **Preparación para Futuro:** Habilitar la posibilidad de implementar multi-tenancy (múltiples usuarios) y filtrado avanzado vía SQL.

## 3\. Alcance (Scope)

### 3.1 Dentro del Alcance (In-Scope)

  * Diseño y creación del esquema de base de datos (DDL) en MySQL.
  * Implementación de la capa de conexión en el proyecto Astro/Node.
  * Desarrollo de un script de migración "one-off" para transferir los datos históricos del CSV a MySQL.
  * Refactorización del módulo de lectura (`src/utils/dataProcessor.ts`).
  * Refactorización del endpoint de escritura (`src/pages/api/records.ts`).
  * Configuración de variables de entorno para seguridad.

### 3.2 Fuera del Alcance (Out-of-Scope)

  * Implementación de sistemas de Login/Registro de usuarios (Auth). *Nota: La base de datos incluirá un campo `user_id` pero se usará un valor por defecto.*
  * Cambios en la interfaz de usuario (Frontend React/Astro).
  * Despliegue de la base de datos en producción (se asume entorno local/desarrollo para esta fase).

## 4\. Especificaciones Técnicas

### 4.1 Stack Tecnológico

  * **Base de Datos:** MySQL 8.0 (o MariaDB compatible).
  * **ORM / Query Builder:** **Drizzle ORM** (Recomendado por su compatibilidad con TypeScript y ligereza) o `mysql2` nativo.
  * **Entorno:** Node.js (existente).

### 4.2 Modelo de Datos (Schema)

Se creará la tabla `body_metrics` que reemplaza las columnas del CSV.

```sql
CREATE TABLE body_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT 1,                -- Placeholder para futuro Auth
    recorded_at DATE NOT NULL,            -- Reemplaza columna 'Date'
    
    -- Métricas Principales
    weight DECIMAL(5, 2) NOT NULL,        -- Weight (kg)
    bmi DECIMAL(4, 1),                    -- BMI
    fat_mass_kg DECIMAL(5, 2),            -- Fat Mass (kg)
    fat_mass_percent DECIMAL(4, 1),       -- Fat Mass (%)
    muscle_mass_kg DECIMAL(5, 2),         -- Muscle Mass (kg)
    free_mass_kg DECIMAL(5, 2),           -- Fat Free Mass (kg)
    
    -- Métricas de Composición
    water_kg DECIMAL(5, 2),               -- Total Body Water (kg)
    water_percent DECIMAL(4, 1),          -- Total Body Water (%)
    bone_mass_kg DECIMAL(4, 2),           -- Bone Mineral Mass (kg)
    visceral_fat DECIMAL(4, 1),           -- Visceral Fat Rating
    
    -- Metabolismo
    bmr DECIMAL(6, 2),                    -- Basal Metabolic Rate (kcal)
    metabolic_age TINYINT,                -- Metabolic Age
    
    -- Bioimpedancia (Avanzado)
    phase_angle DECIMAL(4, 2),            -- Phase Angle
    resistance DECIMAL(6, 2),             -- Resistance (R)
    reactance DECIMAL(6, 2),              -- Reactance (Xc)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 Mapeo de Campos

Es crítico asegurar que la transformación de datos mantenga la compatibilidad con la interfaz TypeScript `RegistroCorporalRaw` existente.

| Interfaz TS (`RegistroCorporalRaw`) | Columna MySQL | Tipo SQL | Notas |
| :--- | :--- | :--- | :--- |
| `Fecha` | `recorded_at` | `DATE` | CSV usa `DD/MM/YYYY`, SQL usa `YYYY-MM-DD`. |
| `Peso` | `weight` | `DECIMAL` | |
| `GrasaPorc` | `fat_mass_percent` | `DECIMAL` | |
| `MusculoKg` | `muscle_mass_kg` | `DECIMAL` | |
| ...resto de campos... | ... | ... | Mapeo directo 1 a 1. |

## 5\. Requerimientos Funcionales

### 5.1 Migración de Datos (Script)

Debe existir un script ejecutable (`npm run migrate:csv`) que:

1.  Lea el archivo `src/data/registros.csv`.
2.  Parsee las fechas formato `DD/MM/YYYY` a objetos Date válidos.
3.  Sanitice valores numéricos (convierta strings vacíos a `0` o `NULL` según corresponda).
4.  Inserte los registros en la tabla `body_metrics`.

### 5.2 Lectura de Datos (`dataProcessor.ts`)

  * La función principal `loadRecords()` ya no leerá el archivo.
  * Debe ejecutar `SELECT * FROM body_metrics ORDER BY recorded_at ASC`.
  * **Importante:** Debe mantener la lógica de cálculo de "Deltas" (comparación con el registro anterior) en la aplicación (Node.js) después de obtener los datos, para no complicar la query SQL en esta etapa.

### 5.3 Escritura de Datos (`api/records.ts`)

  * El endpoint POST debe recibir el JSON.
  * Validar datos básicos.
  * Ejecutar un `INSERT` en la base de datos.
  * Manejar errores de conexión a BD y devolver un status 500 si falla.

## 6\. Plan de Implementación y Tareas

1.  **Configuración de Entorno:**
      * Instalar driver MySQL.
      * Crear archivo `.env` con credenciales (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`).
2.  **Capa de Acceso a Datos (DAL):**
      * Crear `src/db/client.ts` (conexión).
      * Crear `src/db/schema.ts` (definiciones).
3.  **Migración:**
      * Desarrollar y ejecutar script de importación de CSV.
4.  **Backend Refactor:**
      * Actualizar `src/utils/dataProcessor.ts` para usar el cliente DB.
      * Actualizar `src/pages/api/records.ts` para usar el cliente DB.
5.  **Limpieza:**
      * Renombrar `registros.csv` a `registros.csv.bak` para asegurar que ya no se usa.

## 7\. Criterios de Aceptación (DoD)

  * [ ] La aplicación arranca sin errores de conexión a la BD.
  * [ ] El Dashboard muestra exactamente el mismo número de registros que el CSV original.
  * [ ] Los valores numéricos coinciden (no hay pérdida de precisión decimal).
  * [ ] Las flechas de tendencia (comparación con el día anterior) funcionan correctamente en la UI.
  * [ ] Al agregar un nuevo registro desde `/register`, este persiste en MySQL y es visible inmediatamente en el historial.
  * [ ] El archivo CSV original puede ser eliminado sin romper la aplicación.