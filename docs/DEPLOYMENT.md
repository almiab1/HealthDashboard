# Deployment Guide

## Targets

HealthDashboard produces two deployment targets from the same codebase:

| Target | Output | Stack | Database |
|--------|--------|-------|----------|
| **Web** | Node.js server (`dist/`) | Astro SSR + @astrojs/node | MySQL 8.0 |
| **Desktop** | Native binary (`.deb`, `.AppImage`, `.msi`, `.exe`, `.dmg`) | Tauri 2 + Rust | Embedded SQLite |

---

## Web Deployment

### Prerequisites

- Node.js 20+
- pnpm 10.28+ (`corepack enable && corepack prepare pnpm@10.28.2 --activate`)
- MySQL 8.0 instance

### Environment

Create a `.env` file:

```env
DATABASE_URL="mysql://user:password@localhost:3306/health_dashboard"
```

### Local Development

```bash
# Start MySQL (Docker)
docker compose up -d

# Install dependencies
pnpm install

# Run database migrations
pnpm db:generate
pnpm db:migrate

# Start dev server (http://localhost:4321)
pnpm dev
```

### Production Build

```bash
pnpm build
```

This produces a standalone Node.js server in `dist/`:

```bash
node dist/server/entry.mjs
```

The server listens on port 3000 by default (configurable via `HOST` and `PORT` env vars from `@astrojs/node`).

### Docker (development database only)

The provided `docker-compose.yml` runs MySQL for local development:

```yaml
services:
  db:
    image: mysql:8.0
    container_name: health_dashboard_db
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: health_dashboard
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
```

```bash
docker compose up -d     # Start
docker compose down      # Stop
docker compose down -v   # Stop and delete data
```

### Database Migrations

Drizzle Kit manages schema migrations:

```bash
pnpm db:generate   # Generate migration files from schema.ts changes
pnpm db:migrate    # Apply pending migrations to MySQL
pnpm db:studio     # Open Drizzle Studio (visual DB browser)
```

Migration files are stored in `drizzle/` and should be committed to version control.

---

## Desktop Deployment

### Prerequisites

**All platforms:**
- Node.js 20+
- pnpm 10.28+
- Rust stable (1.77.2+) via [rustup](https://rustup.rs/)

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  build-essential
```

**macOS:**
```bash
xcode-select --install
```

**Windows:**
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C++ workload)

### Development

```bash
# Start desktop dev (Astro dev server + Tauri window)
pnpm tauri:dev
```

This runs two processes:
1. `pnpm desktop:dev` — Astro dev server with desktop config (`astro.config.desktop.mjs`)
2. `cargo run` — Tauri app window loading `http://localhost:4321`

### Production Build

```bash
pnpm tauri:build
```

This triggers the full pipeline:
1. `scripts/build-desktop.sh` runs (page swap + static Astro build → `dist-desktop/`)
2. Rust compilation (release mode)
3. Platform-specific bundling

**Output artifacts** (in `src-tauri/target/release/bundle/`):

| Platform | Formats | Location |
|----------|---------|----------|
| Linux | `.deb`, `.AppImage` | `bundle/deb/`, `bundle/appimage/` |
| Windows | `.msi`, `.exe` (NSIS) | `bundle/msi/`, `bundle/nsis/` |
| macOS | `.dmg`, `.app` | `bundle/dmg/`, `bundle/macos/` |

### Desktop Build Process Details

The `scripts/build-desktop.sh` script handles the Astro page swap:

```
src/pages/ (SSR pages with API routes)
    ↓ backup to src/.pages-backup/
src/pages-desktop/ (static pages, client:only components)
    ↓ copy to src/pages/
astro build --config astro.config.desktop.mjs
    ↓ output to dist-desktop/
src/.pages-backup/ → restored to src/pages/
```

Cleanup is guaranteed via a bash `trap` — even if the build fails, original pages are restored.

### Tauri Configuration

Key settings in `src-tauri/tauri.conf.json`:

```json
{
  "productName": "HealthDashboard",
  "version": "0.1.0",
  "identifier": "com.healthdashboard.app",
  "build": {
    "frontendDist": "../dist-desktop",
    "devUrl": "http://localhost:4321",
    "beforeDevCommand": "npm run desktop:dev",
    "beforeBuildCommand": "npm run desktop:build"
  },
  "app": {
    "windows": [{
      "title": "Health Dashboard",
      "width": 1200,
      "height": 800,
      "resizable": true
    }]
  },
  "bundle": {
    "active": true,
    "targets": "all"
  }
}
```

### Desktop Data Storage

SQLite database is auto-created at first launch:

| OS | Path |
|----|------|
| Linux | `~/.local/share/healthdashboard/data.db` |
| macOS | `~/Library/Application Support/healthdashboard/data.db` |
| Windows | `C:\Users\<user>\AppData\Roaming\healthdashboard\data.db` |

Tables (`body_metrics`, `app_settings`) are created automatically if they don't exist.

---

## Cross-Platform Build Script

`scripts/deploy.sh` builds Linux and Windows artifacts from a WSL environment:

```bash
# Build for both platforms
bash scripts/deploy.sh

# Build Linux only
bash scripts/deploy.sh --skip-windows

# Build Windows only
bash scripts/deploy.sh --skip-linux
```

**How it works:**
1. Checks prerequisites on both WSL (node, pnpm, cargo, tauri-cli, system libs) and Windows host (via `powershell.exe`)
2. Builds the static frontend once (`scripts/build-desktop.sh`)
3. Linux build: runs `pnpm tauri build` natively in WSL
4. Windows build: invokes `powershell.exe` to run `pnpm tauri build` on the Windows host

**Requirements for Windows cross-build from WSL:**
- Node.js, pnpm, and Rust must be installed on the Windows host
- WSL must have access to `powershell.exe`

---

## CI/CD — GitHub Actions

### Automated Releases

The `.github/workflows/build-release.yml` workflow builds for all platforms on tag push:

**Triggers:**
- Push a tag matching `v*` (e.g., `git tag v1.0.0 && git push --tags`)
- Manual dispatch from GitHub Actions UI

**Build matrix:**

| Runner | Platform | Extra Args |
|--------|----------|------------|
| `windows-latest` | Windows | — |
| `ubuntu-22.04` | Linux | — |
| `macos-latest` | macOS | `--target universal-apple-darwin` |

**Pipeline steps (per platform):**
1. Checkout code
2. Setup Node 20 + pnpm 8 + Rust stable
3. Install system deps (Ubuntu: webkit2gtk, appindicator3, librsvg2, patchelf)
4. `pnpm install`
5. `tauri-apps/tauri-action@v0` — builds and uploads artifacts to a GitHub Release

**Release output:**
- Creates a **draft** GitHub Release named "Health Dashboard v{version}"
- Attaches all platform binaries as release assets
- Draft mode allows manual review before publishing

### Creating a Release

```bash
# 1. Update version in src-tauri/tauri.conf.json and package.json
# 2. Commit and tag
git add -A
git commit -m "release: v1.1.0"
git tag v1.1.0
git push origin main --tags

# 3. GitHub Actions builds all platforms automatically
# 4. Review and publish the draft release on GitHub
```

---

## Environment Variables Reference

| Variable | Required | Used By | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Web only | `src/db/client.ts` | MySQL connection string |
| `HOST` | No | `@astrojs/node` | Web server bind address (default: `localhost`) |
| `PORT` | No | `@astrojs/node` | Web server port (default: `3000`) |
| `GITHUB_TOKEN` | CI only | `tauri-action` | Auto-provided by GitHub Actions for release uploads |

Desktop mode uses no environment variables — all configuration is stored in the embedded SQLite database.

---

## Troubleshooting

### `@tauri-apps/api/core` resolution error

If Vite fails to resolve `@tauri-apps/api/core`, the npm package may be a broken version:

```bash
# Check installed version
cat node_modules/@tauri-apps/api/package.json | grep version

# If version is 2.10.0 (deprecated/broken), update:
pnpm add @tauri-apps/api@latest
```

### Desktop build fails to restore pages

If `build-desktop.sh` is interrupted without triggering the `trap`, pages may be in a bad state:

```bash
# Check if backup exists
ls src/.pages-backup/

# Manual restore
rm -rf src/pages
mv src/.pages-backup src/pages
```

### MySQL connection refused

```bash
# Ensure Docker container is running
docker compose up -d

# Verify connection
docker compose exec db mysql -u user -ppassword health_dashboard -e "SELECT 1"

# Check .env has correct DATABASE_URL
cat .env
```

### libEGL warnings on WSL (desktop dev)

```
libEGL warning: failed to get driver name for fd -1
MESA: error: ZINK: failed to choose pdev
```

These are expected on headless WSL2 environments without GPU passthrough. The app still functions correctly — WebView falls back to software rendering.
