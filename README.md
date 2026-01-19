# HealthDashboard

HealthDashboard es una aplicación web moderna diseñada para el seguimiento y visualización de métricas de composición corporal. Permite registrar, visualizar y analizar el progreso físico a lo largo del tiempo, basándose en datos detallados como peso, grasa corporal, masa muscular, entre otros.

## 🚀 Características

- **Dashboard Principal**: Visualización rápida de métricas clave con indicadores de tendencia y gráficas de área.
- **Registro de Datos**: Interfaz sencilla para ingresar nuevas mediciones corporales.
- **Historial Detallado**: Tabla completa de registros con opciones de filtrado, ordenamiento y edición.
- **Persistencia de Datos**: Almacenamiento seguro en base de datos MySQL.
- **Análisis Temporal**: Filtrado dinámico por rangos de fecha (30 días, 3 meses, 6 meses, 1 año, Todo o personalizado).

## 🛠 Stack Tecnológico

- **Framework**: [Astro 5](https://astro.build) (SSR con Node.js Adapter)
- **UI Library**: [React 19](https://react.dev)
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com)
- **Base de Datos**: MySQL 8.0
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Gráficos**: Recharts
- **Estado Global**: Zustand
- **Iconos**: Lucide React

## 📦 Instalación y Configuración

### Prerrequisitos

- Node.js 20+
- Docker y Docker Compose (para la base de datos)

### Pasos

1. **Clonar el repositorio e instalar dependencias:**

   ```bash
   npm install
   ```

2. **Configurar las variables de entorno:**

   Crea un archivo `.env` en la raíz del proyecto basado en la configuración de base de datos. Ejemplo:

   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/health_dashboard"
   ```

3. **Iniciar la base de datos con Docker:**

   ```bash
   docker-compose up -d
   ```

4. **Ejecutar migraciones de base de datos:**

   Prepara y aplica el esquema de la base de datos:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Iniciar el servidor de desarrollo:**

   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:4321`.

## 🧞 Comandos Disponibles

| Comando             | Acción                                                 |
| :------------------ | :----------------------------------------------------- |
| `npm run dev`       | Inicia el servidor de desarrollo local.                |
| `npm run build`     | Construye la aplicación para producción.               |
| `npm run preview`   | Vista previa de la build de producción.                |
| `npm run db:generate`| Genera migraciones de Drizzle basadas en el esquema.  |
| `npm run db:migrate` | Aplica las migraciones a la base de datos.            |
| `npm run db:studio`  | Abre Drizzle Studio para explorar la BD visualmente.  |

## 📂 Estructura del Proyecto

```text
src/
├── components/         # Componentes UI (React y Astro)
│   ├── charts/         # Gráficos (Recharts)
│   ├── dashboard/      # Widgets del dashboard
│   ├── history/        # Tablas y vistas históricas
│   └── ui/             # Componentes base reutilizables
├── db/                 # Configuración de BD y Schema Drizzle
├── layouts/            # Layouts principales de Astro
├── pages/              # Rutas y Endpoints API
├── stores/             # Estado global (Zustand)
└── utils/              # Lógica de negocio y transformadores
```

## 📄 Licencia

Este proyecto es de uso personal y educativo.
