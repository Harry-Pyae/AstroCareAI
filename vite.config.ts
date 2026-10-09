import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Server-side Vite configuration only: never define or expose NASA_API_KEY.
  const env = loadEnv(mode, process.cwd(), '');
  const target = process.env.API_PROXY_TARGET || env.API_PROXY_TARGET || 'http://127.0.0.1:3001';
  return { plugins: [react(), tailwindcss()], server: { proxy: { '/api/space-weather': { target, changeOrigin: false } } } };
});
