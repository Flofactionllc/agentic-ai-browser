import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [cesium()],
  server: {
    port: 5180,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5181',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5180,
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(root, 'index.html'),
        host: path.resolve(root, 'host/index.html'),
      },
    },
  },
});
