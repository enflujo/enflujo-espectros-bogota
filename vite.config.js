import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/enflujo-espectros',
  server: {
    port: 3000,
  },
  publicDir: 'estaticos',
  build: {
    outDir: 'publico',
    assetsDir: 'estaticos',
    sourcemap: true,
    rollupOptions: {
      principal: resolve(__dirname, 'index.html'),
      version1: resolve(__dirname, 'version1.html'),
    },
  },
});
