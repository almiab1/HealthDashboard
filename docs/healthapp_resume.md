# Technical Report: HealthDashboard Application

This document serves as technical and functional context for an LLM, detailing the architecture, tech stack, data model, and business logic of the HealthDashboard application.

## 1. Project Summary

**HealthDashboard** is a web application designed for tracking and visualizing body composition metrics. It allows a user to register, visualize, and analyze their physical progress over time, based on detailed data (probably from a bioimpedance scale). The user's name is configurable from the Settings page.

### Main Features
- **Main Dashboard:** Visualization of key metrics (Weight, % Fat, Muscle Mass) with trend indicators (absolute deltas) and area charts.
- **Data Management:** Persistent storage in **MySQL** database using **Drizzle ORM**.
- **Measurement Registration:** Form to enter new data that is saved to the database.
- **History:** Detailed table of previous records with date filtering capabilities, sorting, and edit/delete actions.
- **Filtering:** Ability to filter data by predefined or custom ranges (global state management with Zustand).

## 2. Tech Stack

The application uses a modern architecture based on **Astro** with islands of interactivity in **React**.

- **Core Framework:** [Astro v5.16](https://astro.build) (Rendering: SSR with Node Adapter).
- **UI Framework:** [React v19](https://react.dev).
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com) (with `@tailwindcss/vite`).
- **Icons:** `lucide-react`.
- **Data Visualization:** `recharts` for charts.
- **Global State:** `zustand` (used for date filters).
- **Backend/Runtime:** Node.js.
- **Persistence:** MySQL (database manager) + Drizzle ORM (abstraction layer).

## 3. Project Structure

```text
src/
├── components/         # UI Components (React and Astro)
│   ├── charts/         # Charts (Recharts)
│   ├── dashboard/      # Dashboard widgets (MetricCard, DateFilter, RecentTable)
│   ├── history/        # Historical view components (HistoryTable)
│   ├── register/       # Registration forms (RegisterForm)
│   └── ui/             # Base components
├── db/                 # Database Layer
│   ├── client.ts       # Drizzle/MySQL connection client
│   └── schema.ts       # Database schema definition
├── layouts/            # Page layouts (MainLayout)
├── pages/              # Application routes
│   ├── api/            # API Endpoints (records, records/[id])
│   ├── index.astro     # Main dashboard
│   ├── history.astro   # Complete historical view
│   └── register.astro  # Data registration page
├── stores/             # Global state (Zustand - useDateFilterStore)
└── utils/              # Business logic and processing
    ├── dataProcessor.ts # Data transformers DB <-> UI
    └── data.ts          # Type and interface definitions
```

## 4. Data Model

The application has migrated from CSV files to a MySQL relational database.

### Database Schema (`src/db/schema.ts`)
The `body_metrics` table defines the storage structure:

```typescript
export const bodyMetrics = mysqlTable('body_metrics', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').default(1),
  recordedAt: date('recorded_at').notNull(),
  
  // Main Metrics
  weight: decimal('weight', { precision: 5, scale: 2 }).notNull(),
  bmi: decimal('bmi', { precision: 4, scale: 1 }),
  fatMassKg: decimal('fat_mass_kg', { precision: 5, scale: 2 }),
  fatMassPercent: decimal('fat_mass_percent', { precision: 4, scale: 1 }),
  muscleMassKg: decimal('muscle_mass_kg', { precision: 5, scale: 2 }),
  freeMassKg: decimal('free_mass_kg', { precision: 5, scale: 2 }),
  
  // Composition Metrics
  waterKg: decimal('water_kg', { precision: 5, scale: 2 }),
  waterPercent: decimal('water_percent', { precision: 4, scale: 1 }),
  boneMassKg: decimal('bone_mass_kg', { precision: 4, scale: 2 }),
  visceralFat: decimal('visceral_fat', { precision: 4, scale: 1 }),
  
  // Metabolism
  bmr: decimal('bmr', { precision: 6, scale: 2 }),
  metabolicAge: tinyint('metabolic_age'),
  
  // Bioimpedance (Advanced)
  phaseAngle: decimal('phase_angle', { precision: 4, scale: 2 }),
  resistance: decimal('resistance', { precision: 6, scale: 2 }),
  reactance: decimal('reactance', { precision: 6, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow()
});
```

### Internal Interface (`RegistroCorporal`)
The data processor transforms DB records to a TypeScript interface used in the frontend (UI), mapping DB column names to PascalCase properties (e.g., `recordedAt` -> `Fecha`, `fatMassKg` -> `GrasaKg`).

## 5. Main Business Logic

### Data Processing (`src/utils/dataProcessor.ts`)
1.  **Reading:** `select` queries are performed on the database using Drizzle ORM.
2.  **Mapping:** The `mapDbRecordToUi` function converts the object returned by Drizzle to the `RegistroCorporal` interface used by React components.
3.  **Delta Calculation:**
    *   The `getLastRecordWithDelta()` function retrieves the last and second-to-last records ordered by date.
    *   Calculates the **absolute difference** (Current Value - Previous Value) to display in metric cards.

### API (`src/pages/api/records`)
*   **GET / DELETE / POST:** Handled through Astro endpoints that interact with the MySQL database.
*   **Validation:** Incoming data is validated before inserting or updating in the database.

### Visualization
*   **MetricCard:** Displays the current value, unit, and difference from the previous period.
    *   Shows the absolute change (e.g., `-0.5 kg`) instead of percentage.
    *   Trend colors: Green for positive changes (or negative if `inverseTrend` is true, as in weight/fat).
*   **Date Filters:** `DateFilter` component integrated in the dashboard header, with tab-style for quick selection (30 days, 3 months, etc.) or custom range.

## 6. Development Considerations

*   **Rendering:** Most pages use SSR. Components like `DateFilter`, `MetricCard`, and `HistoryTable` are interactive islands (`client:load`).
*   **Database:** A running MySQL instance is required (configured in `.env`). Migrations are handled with Drizzle Kit.
*   **Styling:** Consistent dark design with Tailwind CSS.
