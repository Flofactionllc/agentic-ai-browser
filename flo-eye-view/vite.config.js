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
        // Forward auth cookies for access-code gate
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.cookie) proxyReq.setHeader('cookie', req.headers.cookie);
            const tomtom = req.headers['x-flo-eye-tomtom-key'];
            if (tomtom) proxyReq.setHeader('x-flo-eye-tomtom-key', tomtom);
          });
        },
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
