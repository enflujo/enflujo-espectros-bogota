import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // base: '/',
  server: {
    port: 3000,
  },
  publicDir: 'estaticos',
  build: {
    outDir: 'public',
    assetsDir: 'estaticos',
    sourcemap: true,
    rollupOptions: {
      principal: resolve(__dirname, 'index.html'),
      version1: resolve(__dirname, 'version1.html'),
    },
  },
});
