import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vercel runs api/space-weather.ts in production; `npm run dev` runs the same
// handler here so the card behaves identically with no second process.
const devApi: Plugin = {
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use('/api/space-weather', async (_request, response) => {
      const { GET } = await server.ssrLoadModule('/api/space-weather.ts');
      const result: Response = await GET();
      response.statusCode = result.status;
      result.headers.forEach((value, name) => response.setHeader(name, value));
      response.end(await result.text());
    });
  },
};

export default defineConfig({ plugins: [react(), tailwindcss(), devApi] });
