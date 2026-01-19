Aquí tienes el **Documento de Requisitos del Producto (PRD)** completo, estructurado en Markdown y listo para ser añadido a tu repositorio o gestor de documentación.

Ha sido adaptado específicamente para tu stack (Astro + React/Shadcn) y tus datos.

-----

# PRD: Dashboard de Evolución de Composición Corporal

| Metadatos | Detalle |
| :--- | :--- |
| **Versión** | 1.0.0 (MVP) |
| **Fecha** | 03 de Diciembre, 2025 |
| **Estado** | Borrador / Planificación |
| **Tecnología** | Astro, Tailwind, Shadcn UI, Recharts |
| **Diseño Base** | [TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard) |

-----

## 1\. Resumen Ejecutivo

Desarrollo de una aplicación web tipo "Dashboard" para la visualización y seguimiento de métricas antropométricas y de composición corporal. La herramienta transformará datos crudos provenientes de informes nutricionales en visualizaciones interactivas que permitan entender la **recomposición corporal** (relación músculo/grasa) más allá del simple peso total.

El proyecto busca replicar la estética profesional de *TailAdmin* pero utilizando **Astro** para obtener un rendimiento superior y una arquitectura basada en islas.

## 2\. Objetivos del Proyecto

1.  **Visualización de Calidad:** Permitir ver de un vistazo si la bajada de peso corresponde a pérdida de grasa o músculo.
2.  **Seguimiento de Salud Celular:** Monitorear el "Ángulo de Fase" como indicador clave de recuperación y estado nutricional.
3.  **Cálculo Automático de Variaciones:** Mostrar automáticamente cuánto se ha ganado o perdido respecto a la medición anterior (Deltas).
4.  **Arquitectura Escalable:** Base sólida en Astro que permita a futuro conectar una base de datos real (actualmente datos estáticos/hardcoded).

-----

## 3\. Especificaciones Técnicas

### 3.1 Stack Tecnológico

  * **Core Framework:** [Astro 5.x](https://astro.build/) (Renderizado estático con islas de interactividad).
  * **Lenguaje:** TypeScript.
  * **Estilos:** Tailwind CSS.
  * **Componentes UI:** [Shadcn UI](https://ui.shadcn.com/) (React).
  * **Gráficos:** [Recharts](https://recharts.org/) (Librería de gráficos para React, altamente personalizable).
  * **Iconos:** Lucide React.
  * **Fuentes:** Inter o Satoshi (basado en TailAdmin).

### 3.2 Arquitectura de Datos

Los datos se manejarán inicialmente como una constante en el código (`rawData`), pero deben ser procesados antes de renderizarse.

**Entidad: RegistroCorporal**

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `Fecha` | `Date` | Fecha de medición (Parseada de string "DD/MM/YYYY"). |
| `Peso` | `Number` | Peso total en Kg. |
| `GrasaKg` | `Number` | Masa grasa total. |
| `GrasaPorc` | `Number` | Porcentaje de grasa. |
| `MusculoKg` | `Number` | Masa muscular esquelética. |
| `AguaPorc` | `Number` | Porcentaje de agua corporal. |
| `AnguloFase` | `Number` | Indicador de salud celular (KPI crítico). |
| `IMC` | `Number` | Índice de Masa Corporal. |

-----

## 4\. Requerimientos Funcionales

### 4.1 Procesamiento de Datos (Data Logic)

El sistema debe incluir una utilidad (`/utils/dataProcessor.ts`) que realice:

  * **Parsing:** Convertir `15/09/2025` a objeto JS Date.
  * **Sorting:** Asegurar que los datos estén ordenados cronológicamente.
  * **Delta Calculation:** Generar un nuevo objeto para la "Última Medición" que incluya la diferencia con la penúltima (Ej: `diffPeso: -0.7`).

### 4.2 Dashboard: Vista Principal

Basado en el layout de *TailAdmin*, la pantalla principal debe contener:

**A. Bloque de KPIs (Tarjetas Superiores)**
Cuatro tarjetas destacadas mostrando los datos de la última fecha registrada (`02/12/2025` según dataset):

1.  **Peso Actual:** Valor + Indicador de tendencia (Flecha abajo verde si bajó).
2.  **Masa Muscular:** Valor en Kg + Indicador (Flecha arriba verde si subió).
3.  **Masa Grasa:** Valor en Kg + Indicador (Flecha abajo verde si bajó).
4.  **Ángulo de Fase:** Valor + Explicación breve (tooltip).

**B. Gráfico Principal: "Composición Corporal"**

  * **Tipo:** Composed Chart (Área + Línea).
  * **Ejes:** X (Tiempo), Y (Kg).
  * **Series:**
      * Área sombreada semitransparente: **Grasa (Kg)**.
      * Línea sólida gruesa: **Músculo (Kg)**.
  * **Objetivo:** Visualizar el "Gap" o cruce entre ambas métricas.

**C. Gráfico Secundario: "Salud e Hidratación"**

  * **Tipo:** Gráfico de líneas doble eje o áreas apiladas al 100%.
  * **Métricas:** % Grasa vs % Agua (suelen ser inversamente proporcionales).

### 4.3 Vista de Tabla (Histórico)

  * Tabla completa usando componentes de Shadcn (`Table`, `TableRow`, `TableCell`).
  * Formato condicional en las celdas:
      * Si `AnguloFase` \< 5: Texto Rojo.
      * Si `AnguloFase` \> 7: Texto Verde.

-----

## 5\. Diseño de Interfaz (UI Layout)

Se utilizará una adaptación del layout "Sidebar" de TailAdmin.

### Estructura de Componentes Astro

```text
src/
├── components/
│   ├── charts/
│   │   ├── CompositionChart.tsx  (Recharts - Isla React)
│   │   └── TrendChart.tsx
│   ├── dashboard/
│   │   ├── KPICard.astro         (Componente estático o híbrido)
│   │   └── DataTable.tsx         (Shadcn Table)
│   ├── layout/
│   │   ├── Sidebar.astro
│   │   └── Header.astro
├── layouts/
│   └── MainLayout.astro          (Shell de la aplicación)
├── pages/
│   ├── index.astro               (Dashboard)
│   └── history.astro             (Tabla completa)
└── utils/
    └── data.ts                   (Tu rawData y funciones de proceso)
```

### Paleta de Colores (Sugerida)

  * **Fondo:** `slate-50` (Light) / `slate-950` (Dark).
  * **Acento Primario (Músculo):** `emerald-600` (Representa salud/construcción).
  * **Acento Secundario (Grasa):** `amber-500` (Representa alerta/energía).
  * **Acento Terciario (Agua/Fase):** `blue-500`.

-----

## 6\. Fases de Desarrollo

### Fase 1: Setup & Estructura (Día 1)

  * Inicializar proyecto Astro + Tailwind.
  * Configurar integración de React.
  * Instalar Shadcn UI y componentes base (Card, Button).
  * Copiar `rawDate` a un archivo TS y crear función de parseo.

### Fase 2: Componentes UI Base (Día 2)

  * Implementar el Layout (Sidebar + Header) estático imitando TailAdmin.
  * Crear el componente `KPICard` que reciba props (título, valor, delta).

### Fase 3: Visualización de Datos (Día 3)

  * Instalar `recharts`.
  * Crear `CompositionChart.tsx`.
  * Integrar los gráficos en `index.astro` usando `client:load` (necesario para interactividad de gráficos).

### Fase 4: Refinamiento (Día 4)

  * Ajustar espaciados y tipografía.
  * Implementar Dark Mode (opcional en MVP).
  * Deploy (Netlify/Vercel).

-----

## 7\. Notas sobre los Datos Actuales

  * **Observación:** Hay registros semanales constantes.
  * **Edge Case:** El gráfico debe manejar bien el eje X para que las fechas se vean legibles (formatear como "DD MMM").
  * **Validación:** El IMC calculado en el CSV parece correcto, pero se recomienda recalcularlo en el frontend `(Peso / Altura^2)` si se dispone de la altura, para asegurar consistencia, o usar el dato duro si la altura varía. *Para este MVP, usaremos el dato duro.*