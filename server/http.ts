import { createServer } from 'node:http';
import type { SpaceWeatherResponse } from './donki.ts';
import { createSpaceWeatherHandler } from './endpoint.ts';

export function createProxyServer(options: { frontendOrigin: string; load: () => Promise<SpaceWeatherResponse>; cacheMs?: number }) {
  const handle = createSpaceWeatherHandler(options);
  return createServer(async (request, response) => {
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers)) {
        if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
      const result = await handle(new Request(new URL(request.url ?? '/', 'http://localhost'), {
        method: request.method, headers,
      }));
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(await result.text());
    } catch {
      response.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ error: { code: 'upstream_unavailable' }, fallback: 'synthetic_demo' }));
    }
  });
}
