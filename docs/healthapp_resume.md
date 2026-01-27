# Informe Técnico: HealthDashboard Application

Este documento sirve como contexto técnico y funcional para un LLM, detallando la arquitectura, stack tecnológico, modelo de datos y lógica de negocio de la aplicación HealthDashboard.

## 1. Resumen del Proyecto

**HealthDashboard** es una aplicación web diseñada para el seguimiento y visualización de métricas de composición corporal. Permite a un usuario registrar, visualizar y analizar su progreso físico a lo largo del tiempo, basándose en datos detallados (probablemente de una báscula de bioimpedancia). El nombre del usuario es configurable desde la página de Configuración.

### Características Principales
- **Dashboard Principal:** Visualización de métricas clave (Peso, % Grasa, Masa Muscular) con indicadores de tendencia (deltas absolutos) y gráficas de área.
- **Gestión de Datos:** Almacenamiento persistente en base de datos **MySQL** utilizando **Drizzle ORM**.
- **Registro de Medidas:** Formulario para ingresar nuevos datos que se guardan en la base de datos.
- **Histórico:** Tabla detallada de registros anteriores con capacidades de filtrado por fecha, ordenamiento y acciones de edición/eliminado.
- **Filtrado:** Capacidad de filtrar datos por rangos predefinidos o personalizados (gestión de estado global con Zustand).

## 2. Stack Tecnológico

La aplicación utiliza una arquitectura moderna basada en **Astro** con islas de interactividad en **React**.

- **Framework Core:** [Astro v5.16](https://astro.build) (Rendering: SSR con Adapter Node).
- **UI Framework:** [React v19](https://react.dev).
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com) (con `@tailwindcss/vite`).
- **Iconos:** `lucide-react`.
- **Visualización de Datos:** `recharts` para gráficos.
- **Estado Global:** `zustand` (usado para filtros de fecha).
- **Backend/Runtime:** Node.js.
- **Persistencia:** MySQL (gestor de base de datos) + Drizzle ORM (capa de abstracción).

## 3. Estructura del Proyecto

```text
src/
├── components/         # Componentes UI (React y Astro)
│   ├── charts/         # Gráficos (Recharts)
│   ├── dashboard/      # Widgets del dashboard (MetricCard, DateFilter, RecentTable)
│   ├── history/        # Componentes de la vista histórica (HistoryTable)
│   ├── register/       # Formularios de registro (RegisterForm)
│   └── ui/             # Componentes base
├── db/                 # Capa de Base de Datos
│   ├── client.ts       # Cliente de conexión Drizzle/MySQL
│   └── schema.ts       # Definición del esquema de base de datos
├── layouts/            # Layouts de página (MainLayout)
├── pages/              # Rutas de la aplicación
│   ├── api/            # Endpoints API (records, records/[id])
│   ├── index.astro     # Dashboard principal
│   ├── history.astro   # Vista histórica completa
│   └── register.astro  # Página de registro de datos
├── stores/             # Estado global (Zustand - useDateFilterStore)
└── utils/              # Lógica de negocio y procesamiento
    ├── dataProcessor.ts # Transformadores de datos DB <-> UI
    └── data.ts          # Definiciones de tipos e interfaces
```

## 4. Modelo de Datos

La aplicación ha migrado de archivos CSV a una base de datos relacional MySQL.

### Esquema de Base de Datos (`src/db/schema.ts`)
La tabla `body_metrics` define la estructura de almacenamiento:

```typescript
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
```

### Interfaz Interna (`RegistroCorporal`)
El procesador de datos transforma los registros de la DB a una interfaz TypeScript utilizada en el frontend (UI), mapeando los nombres de columnas de la DB a propiedades en PascalCase (ej. `recordedAt` -> `Fecha`, `fatMassKg` -> `GrasaKg`).

## 5. Lógica de Negocio Principal

### Procesamiento de Datos (`src/utils/dataProcessor.ts`)
1.  **Lectura:** Se realizan consultas `select` a la base de datos usando Drizzle ORM.
2.  **Mapeo:** La función `mapDbRecordToUi` convierte el objeto devuelto por Drizzle a la interfaz `RegistroCorporal` usada por los componentes de React.
3.  **Cálculo de Deltas:**
    *   La función `getLastRecordWithDelta()` obtiene el último y penúltimo registro ordenados por fecha.
    *   Calcula la **diferencia absoluta** (Valor Actual - Valor Anterior) para mostrar en las tarjetas de métricas.

### API (`src/pages/api/records`)
*   **GET / DELETE / POST:** Se manejan a través de endpoints de Astro que interactúan con la base de datos MySQL.
*   **Validación:** Se validan los datos entrantes antes de insertar o actualizar en la base de datos.

### Visualización
*   **MetricCard:** Muestra el valor actual, la unidad y la diferencia con respecto al periodo anterior.
    *   Muestra el cambio absoluto (ej. `-0.5 kg`) en lugar de porcentaje.
    *   Colores de tendencia: Verde para cambios positivos (o negativos si `inverseTrend` es true, como en peso/grasa).
*   **Filtros de Fecha:** Componente `DateFilter` integrado en el encabezado del dashboard, con estilo de pestañas ("tabs") para selección rápida (30 días, 3 meses, etc.) o rango personalizado.

## 6. Consideraciones para el Desarrollo

*   **Renderizado:** La mayoría de las páginas usan SSR. Componentes como `DateFilter`, `MetricCard` y `HistoryTable` son islas interactivas (`client:load`).
*   **Base de Datos:** Se requiere una instancia de MySQL corriendo (configurada en `.env`). Las migraciones se manejan con Drizzle Kit.
*   **Estilos:** Diseño oscuro consistente con Tailwind CSS.
