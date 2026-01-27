# HealthDashboard

HealthDashboard is a modern web application designed for tracking and visualizing body composition metrics. It allows you to record, visualize, and analyze physical progress over time, based on detailed data such as weight, body fat, muscle mass, and more.

## 🚀 Features

- **Main Dashboard**: Quick visualization of key metrics with trend indicators and area charts.
- **Data Registration**: Simple interface to enter new body measurements.
- **Detailed History**: Complete table of records with filtering, sorting, and editing options.
- **Data Persistence**: Secure storage in MySQL database.
- **Temporal Analysis**: Dynamic filtering by date ranges (30 days, 3 months, 6 months, 1 year, All, or custom).

## 🛠 Tech Stack

- **Framework**: [Astro 5](https://astro.build) (SSR with Node.js Adapter)
- **UI Library**: [React 19](https://react.dev)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Database**: MySQL 8.0
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Charts**: Recharts
- **Global State**: Zustand
- **Icons**: Lucide React

## 📦 Installation and Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for the database)

### Steps

1. **Clone the repository and install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Create a `.env` file in the project root based on the database configuration. Example:

   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/health_dashboard"
   ```

3. **Start the database with Docker:**

   ```bash
   docker-compose up -d
   ```

4. **Run database migrations:**

   Prepare and apply the database schema:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the development server:**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:4321`.

## 🧞 Available Commands

| Command             | Action                                                 |
| :------------------ | :----------------------------------------------------- |
| `npm run dev`       | Starts local development server.                |
| `npm run build`     | Build the application for production.               |
| `npm run preview`   | Preview the production build.                |
| `npm run db:generate`| Generate Drizzle migrations based on the schema.  |
| `npm run db:migrate` | Apply migrations to the database.            |
| `npm run db:studio`  | Open Drizzle Studio to explore the DB visually.  |

## 📂 Project Structure

```text
src/
├── components/         # UI Components (React and Astro)
│   ├── charts/         # Charts (Recharts)
│   ├── dashboard/      # Dashboard widgets
│   ├── history/        # Historical tables and views
│   └── ui/             # Reusable base components
├── db/                 # DB configuration and Drizzle Schema
├── layouts/            # Main Astro layouts
├── pages/              # Routes and API Endpoints
├── stores/             # Global state (Zustand)
└── utils/              # Business logic and transformers
```

## 📄 License

This project is for personal and educational use.
