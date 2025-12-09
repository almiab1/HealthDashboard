# Informe Técnico: HealthDashboard Application

Este documento sirve como contexto técnico y funcional para un LLM, detallando la arquitectura, stack tecnológico, modelo de datos y lógica de negocio de la aplicación HealthDashboard.

## 1. Resumen del Proyecto

**HealthDashboard** es una aplicación web diseñada para el seguimiento y visualización de métricas de composición corporal. Permite a un usuario ("Alex" según el código) registrar, visualizar y analizar su progreso físico a lo largo del tiempo, basándose en datos detallados (probablemente de una báscula de bioimpedancia).

### Características Principales
- **Dashboard Principal:** Visualización de métricas clave (Peso, % Grasa, Masa Muscular) con indicadores de tendencia (deltas).
- **Gestión de Datos:** Almacenamiento basado en archivo plano (CSV). Lectura y escritura directa.
- **Registro de Medidas:** Formulario para ingresar nuevos datos que se persisten en el CSV.
- **Histórico:** Tabla detallada de registros anteriores.
- **Filtrado:** Capacidad de filtrar datos por fecha (gestión de estado global).

## 2. Stack Tecnológico

La aplicación utiliza una arquitectura moderna basada en **Astro** con islas de interactividad en **React**.

- **Framework Core:** [Astro v5.16](https://astro.build) (Rendering: SSR con Adapter Node).
- **UI Framework:** [React v19](https://react.dev).
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com) (con `@tailwindcss/vite`).
- **Iconos:** `lucide-react`.
- **Visualización de Datos:** `recharts` para gráficos.
- **Estado Global:** `zustand` (usado para filtros de fecha).
- **Backend/Runtime:** Node.js (modo `standalone`).
- **Persistencia:** Archivo CSV local (`src/data/registros.csv`).

## 3. Estructura del Proyecto

```text
src/
├── components/         # Componentes UI (React y Astro)
│   ├── charts/         # Gráficos (Recharts)
│   ├── dashboard/      # Widgets del dashboard (MetricCard, RecentTable)
│   ├── layout/         # Componentes de estructura
│   ├── register/       # Formularios de registro
│   └── ui/             # Componentes base (shadcn-like o custom)
├── data/               # Almacenamiento
│   └── registros.csv   # Fuente de verdad de los datos
├── layouts/            # Layouts de página (MainLayout)
├── pages/              # Rutas de la aplicación
│   ├── api/            # Endpoints API (POST /api/records)
│   ├── index.astro     # Dashboard principal
│   ├── history.astro   # Vista histórica completa
│   └── register.astro  # Página de registro de datos
├── stores/             # Estado global (Zustand)
└── utils/              # Lógica de negocio y procesamiento
    ├── dataProcessor.ts # Parser y transformador de CSV
    └── data.ts          # Definiciones de tipos
```

## 4. Modelo de Datos

La aplicación utiliza un mapeo entre los encabezados del CSV (en inglés) y las claves internas de la interfaz (en español).

### Esquema del CSV (`src/data/registros.csv`)
El archivo CSV contiene las siguientes columnas:
`Date, Weight (kg), BMI, Fat Mass (kg), Fat Mass (%), Fat Free Mass (kg), Muscle Mass (kg), Total Body Water (kg), Total Body Water (%), Basal Metabolic Rate (kcal), Metabolic Age, Visceral Fat Rating, Bone Mineral Mass (kg), Phase Angle, Resistance (R), Reactance (Xc)`

### Interfaz Interna (`RegistroCorporalRaw`)
El parser transforma los datos a la siguiente estructura en TypeScript:

```typescript
interface RegistroCorporalRaw {
  Fecha: string;           // Mapeado de 'Date'
  Peso: number;            // Mapeado de 'Weight (kg)'
  IMC: number;             // Mapeado de 'BMI'
  GrasaKg: number;         // Mapeado de 'Fat Mass (kg)'
  GrasaPorc: number;       // Mapeado de 'Fat Mass (%)'
  MasaLibreKg: number;     // Mapeado de 'Fat Free Mass (kg)'
  MusculoKg: number;       // Mapeado de 'Muscle Mass (kg)'
  AguaKg: number;          // Mapeado de 'Total Body Water (kg)'
  AguaPorc: number;        // Mapeado de 'Total Body Water (%)'
  MetabolismoBasal: number;// Mapeado de 'Basal Metabolic Rate (kcal)'
  EdadMetabolica: number;  // Mapeado de 'Metabolic Age'
  GrasaVisceral: number;   // Mapeado de 'Visceral Fat Rating'
  MasaOsea: number;        // Mapeado de 'Bone Mineral Mass (kg)'
  AnguloFase: number;      // Mapeado de 'Phase Angle'
  Resistencia: number;     // Mapeado de 'Resistance (R)'
  Reactancia: number;      // Mapeado de 'Reactance (Xc)'
}
```

## 5. Lógica de Negocio Principal

### Procesamiento de Datos (`src/utils/dataProcessor.ts`)
1.  **Lectura:** Se lee el archivo CSV usando `fs` (Server-Side).
2.  **Mapeo:** Se utiliza un objeto constante `CSV_MAPPING` para traducir headers a keys.
3.  **Sanitización:** 
    *   Se ignoran líneas vacías.
    *   Campos numéricos faltantes se rellenan con `0`.
    *   La fecha se parsea de string `DD/MM/YYYY` a objeto `Date`.
4.  **Cálculo de Deltas:**
    *   La función `getLastRecordWithDelta()` compara el último registro con el penúltimo.
    *   Calcula la diferencia numérica para cada métrica (ej. `Peso actual - Peso anterior`).
    *   Esto permite mostrar flechas de tendencia en el UI (bajó de peso, subió músculo, etc.).

### Flujo de Escritura (`src/pages/api/records.ts`)
1.  El formulario envía un POST JSON a `/api/records`.
2.  El endpoint valida la existencia de `date` y `weight`.
3.  Se construye una línea de texto CSV respetando el orden de columnas original.
4.  Se hace un `fs.appendFileSync` al archivo `registros.csv`.

### Visualización
*   **Tendencias Inversas:** El componente `MetricCard` soporta `inverseTrend`. Para métricas como Peso o Grasa, un valor negativo (bajar) se muestra en verde (positivo/bueno). Para Músculo, un valor positivo (subir) es verde.

## 6. Consideraciones para el Desarrollo/LLM

*   **Renderizado:** La mayoría de las páginas usan SSR (`output: 'server'`). Los componentes interactivos (Gráficos, Filtros, Formularios) usan `client:load` o `client:only="react"`.
*   **Ruta de Datos:** Al trabajar con los datos, recuerda que la fuente de verdad es el archivo físico CSV. No hay base de datos SQL/NoSQL.
*   **Estilos:** Usa clases utilitarias de Tailwind 4. El tema parece ser oscuro (`text-white`, fondos oscuros).

