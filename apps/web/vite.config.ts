/** Configures the web build, tests, and local API development proxy. */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routeFileIgnorePattern: '\\.test\\.tsx$',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      // Keep API requests distinct from React page URLs; Vite removes the
      // frontend-only /api prefix before forwarding to Express on port 3000.
      '/api': {
        target: 'http://localhost:3000',
        rewrite: (requestPath) => requestPath.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
