import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // base: '/',
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
      espectro: resolve(__dirname, 'espectro.html'),
    },
  },
});
