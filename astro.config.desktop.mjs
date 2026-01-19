// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Configuración para la versión de escritorio (Tauri)
// Usa output: 'static' para generar archivos HTML/CSS/JS empaquetables
export default defineConfig({
  output: 'static',
  
  // Usar páginas específicas para desktop (sin SSR ni API routes)
  srcDir: './src',
  
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    },
    // Definir variable para detectar modo desktop en el código
    define: {
      'import.meta.env.TAURI_BUILD': JSON.stringify(true)
    }
  },

  // Construir en carpeta específica para Tauri
  outDir: './dist-desktop'
});
