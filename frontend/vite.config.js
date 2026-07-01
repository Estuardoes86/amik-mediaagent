import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Forzar nuevo hash en cada build
        entryFileNames: `assets/[name]-[hash]-v1782936250.js`,
        chunkFileNames: `assets/[name]-[hash]-v1782936250.js`,
        assetFileNames: `assets/[name]-[hash]-v1782936250.[ext]`,
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
