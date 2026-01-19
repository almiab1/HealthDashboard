#!/bin/bash

# Script para construir la versión de escritorio (Tauri)
# Usa páginas específicas para desktop que no requieren servidor

set -e

echo "📦 Preparando build de escritorio..."

# Directorio base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAGES_DIR="$BASE_DIR/src/pages"
PAGES_BACKUP="$BASE_DIR/src/.pages-backup"
PAGES_DESKTOP="$BASE_DIR/src/pages-desktop"

# Función para restaurar páginas originales en caso de error
cleanup() {
    if [ -d "$PAGES_BACKUP" ]; then
        echo "🔄 Restaurando páginas originales..."
        rm -rf "$PAGES_DIR"
        mv "$PAGES_BACKUP" "$PAGES_DIR"
    fi
}
trap cleanup EXIT

# Verificar que existan las páginas desktop
if [ ! -d "$PAGES_DESKTOP" ]; then
    echo "❌ Error: No se encontró la carpeta src/pages-desktop"
    exit 1
fi

# Hacer backup de las páginas originales
echo "📁 Haciendo backup de páginas originales..."
mv "$PAGES_DIR" "$PAGES_BACKUP"

# Copiar páginas desktop
echo "📁 Usando páginas de escritorio..."
cp -r "$PAGES_DESKTOP" "$PAGES_DIR"

# Ejecutar build con configuración de desktop
echo "🔨 Construyendo versión estática..."
cd "$BASE_DIR"
npx astro build --config astro.config.desktop.mjs

# Restaurar páginas originales
echo "📁 Restaurando páginas originales..."
rm -rf "$PAGES_DIR"
mv "$PAGES_BACKUP" "$PAGES_DIR"

echo "✅ Build de escritorio completado en ./dist-desktop"
