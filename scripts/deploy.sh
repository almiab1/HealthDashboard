#!/bin/bash

# Deploy script for building HealthDashboard executables for Linux and Windows from WSL.
# Produces Linux (.deb, .AppImage) and Windows (.msi, .exe) artifacts.

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SKIP_LINUX=false
SKIP_WINDOWS=false

for arg in "$@"; do
    case "$arg" in
        --skip-linux) SKIP_LINUX=true ;;
        --skip-windows) SKIP_WINDOWS=true ;;
        --help|-h)
            echo "Usage: bash scripts/deploy.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-linux     Skip the Linux build"
            echo "  --skip-windows   Skip the Windows build"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
    esac
done

log_info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

ARTIFACTS=()

# ---------- Step 1: Prerequisite checks ----------

log_info "Checking prerequisites..."

MISSING_WSL=()
MISSING_WIN=()

# WSL-side checks (needed for Linux build and frontend)
for cmd in node pnpm cargo; do
    if ! command -v "$cmd" &>/dev/null; then
        MISSING_WSL+=("$cmd")
    fi
done

if ! command -v cargo-tauri &>/dev/null && ! pnpm tauri --version &>/dev/null 2>&1; then
    if ! npx tauri --version &>/dev/null 2>&1; then
        MISSING_WSL+=("tauri-cli (install via: cargo install tauri-cli)")
    fi
fi

if [ ${#MISSING_WSL[@]} -ne 0 ]; then
    log_error "Missing WSL tools: ${MISSING_WSL[*]}"
    exit 1
fi
log_ok "WSL tools: node, pnpm, cargo, tauri-cli"

# Linux library checks
if [ "$SKIP_LINUX" = false ]; then
    MISSING_LIBS=()
    dpkg -s libwebkit2gtk-4.1-dev &>/dev/null || MISSING_LIBS+=("libwebkit2gtk-4.1-dev")
    dpkg -s libappindicator3-dev &>/dev/null  || MISSING_LIBS+=("libappindicator3-dev")
    dpkg -s librsvg2-dev &>/dev/null          || MISSING_LIBS+=("librsvg2-dev")
    command -v patchelf &>/dev/null            || MISSING_LIBS+=("patchelf")

    if [ ${#MISSING_LIBS[@]} -ne 0 ]; then
        log_error "Missing Linux libraries: ${MISSING_LIBS[*]}"
        echo "  Install with: sudo apt install ${MISSING_LIBS[*]}"
        exit 1
    fi
    log_ok "Linux build dependencies"
fi

# Windows-side checks (via powershell.exe from WSL)
if [ "$SKIP_WINDOWS" = false ]; then
    if ! command -v powershell.exe &>/dev/null; then
        log_error "powershell.exe not found. Windows build requires access to the Windows host from WSL."
        exit 1
    fi

    WIN_CHECK=$(powershell.exe -NoProfile -Command "
        \$missing = @()
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) { \$missing += 'node' }
        if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) { \$missing += 'cargo' }
        if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { \$missing += 'pnpm' }
        \$missing -join ','
    " 2>/dev/null | tr -d '\r')

    if [ -n "$WIN_CHECK" ]; then
        log_error "Missing Windows-side tools: $WIN_CHECK"
        echo "  The Windows build requires Node.js, pnpm, and Rust installed on the Windows host."
        exit 1
    fi
    log_ok "Windows host tools: node, pnpm, cargo"
fi

# ---------- Step 2: Build frontend (shared) ----------

log_info "Installing dependencies..."
pnpm install

log_info "Building frontend (static desktop build)..."
bash scripts/build-desktop.sh

log_ok "Frontend built to dist-desktop/"

# ---------- Step 3: Linux build ----------

if [ "$SKIP_LINUX" = false ]; then
    log_info "Starting Linux build..."

    # Run pnpm tauri build, overriding beforeBuildCommand to skip it since we already built the frontend
    pnpm tauri build --config '{"build":{"beforeBuildCommand":""}}' 2>&1 | while IFS= read -r line; do
        echo "  $line"
    done

    # Collect Linux artifacts
    BUNDLE_DIR="$BASE_DIR/src-tauri/target/release/bundle"
    if [ -d "$BUNDLE_DIR/deb" ]; then
        while IFS= read -r f; do
            ARTIFACTS+=("$f")
        done < <(find "$BUNDLE_DIR/deb" -name "*.deb" 2>/dev/null)
    fi
    if [ -d "$BUNDLE_DIR/appimage" ]; then
        while IFS= read -r f; do
            ARTIFACTS+=("$f")
        done < <(find "$BUNDLE_DIR/appimage" -name "*.AppImage" 2>/dev/null)
    fi

    log_ok "Linux build complete"
else
    log_warn "Skipping Linux build (--skip-linux)"
fi

# ---------- Step 4: Windows build ----------

if [ "$SKIP_WINDOWS" = false ]; then
    log_info "Starting Windows build..."

    WIN_PROJECT_PATH=$(wslpath -w "$BASE_DIR")
    log_info "Windows project path: $WIN_PROJECT_PATH"

    powershell.exe -NoProfile -Command "
        Set-Location '${WIN_PROJECT_PATH}'
        Write-Host 'Installing dependencies on Windows...'
        pnpm install
        Write-Host 'Building Tauri for Windows...'
        pnpm tauri build --config '{\"build\":{\"beforeBuildCommand\":\"\"}}'
    " 2>&1 | while IFS= read -r line; do
        echo "  $(echo "$line" | tr -d '\r')"
    done

    # Collect Windows artifacts
    BUNDLE_DIR="$BASE_DIR/src-tauri/target/release/bundle"
    if [ -d "$BUNDLE_DIR/msi" ]; then
        while IFS= read -r f; do
            ARTIFACTS+=("$f")
        done < <(find "$BUNDLE_DIR/msi" -name "*.msi" 2>/dev/null)
    fi
    if [ -d "$BUNDLE_DIR/nsis" ]; then
        while IFS= read -r f; do
            ARTIFACTS+=("$f")
        done < <(find "$BUNDLE_DIR/nsis" -name "*.exe" 2>/dev/null)
    fi

    log_ok "Windows build complete"
else
    log_warn "Skipping Windows build (--skip-windows)"
fi

# ---------- Step 5: Summary ----------

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploy build complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

BUNDLE_DIR="$BASE_DIR/src-tauri/target/release/bundle"

if [ "$SKIP_LINUX" = false ]; then
    echo -e "${CYAN}Linux artifacts:${NC}"
    found_linux=false
    for ext in deb AppImage; do
        while IFS= read -r f; do
            echo "  $f"
            found_linux=true
        done < <(find "$BUNDLE_DIR" -name "*.$ext" 2>/dev/null)
    done
    if [ "$found_linux" = false ]; then
        echo "  (none found)"
    fi
    echo ""
fi

if [ "$SKIP_WINDOWS" = false ]; then
    echo -e "${CYAN}Windows artifacts:${NC}"
    found_windows=false
    for ext in msi exe; do
        while IFS= read -r f; do
            echo "  $f"
            found_windows=true
        done < <(find "$BUNDLE_DIR" -name "*.$ext" 2>/dev/null)
    done
    if [ "$found_windows" = false ]; then
        echo "  (none found)"
    fi
    echo ""
fi
