import { createServer } from 'node:http';
import { DonkiError, type SpaceWeatherResponse } from './donki.ts';

export function createProxyServer(options: { frontendOrigin: string; load: () => Promise<SpaceWeatherResponse>; cacheMs?: number }) {
  let cached: SpaceWeatherResponse | undefined;
  let expires = 0;
  let pending: Promise<SpaceWeatherResponse> | undefined;
  let cooldown: { error: DonkiError; until: number } | undefined;
  async function getData() {
    if (cached && Date.now() < expires) return cached;
    if (cooldown && Date.now() < cooldown.until) throw cooldown.error;
    if (!pending) {
      pending = options.load().then(data => { cached = data; expires = Date.now() + (options.cacheMs ?? 60_000); cooldown = undefined; return data; }).catch(error => {
        const safe = error instanceof DonkiError ? error : new DonkiError('upstream_unavailable', 502);
        cooldown = { error: safe, until: Date.now() + (safe.retryAfter ?? 10) * 1000 };
        throw safe;
      }).finally(() => { pending = undefined; });
    }
    return pending;
  }
  return createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Vary', 'Origin');
    const origin = request.headers.origin;
    const send = (status: number, data: unknown) => { response.writeHead(status); response.end(JSON.stringify(data)); };
    if (origin && origin !== options.frontendOrigin) { send(403, { error: { code: 'origin_not_allowed' } }); return; }
    if (origin) response.setHeader('Access-Control-Allow-Origin', options.frontendOrigin);
    // Exact route prevents this endpoint becoming an arbitrary URL/key proxy.
    if (request.url !== '/api/space-weather') { send(404, { error: { code: 'not_found' } }); return; }
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Accept');
      response.writeHead(204); response.end(); return;
    }
    if (request.method !== 'GET') { response.setHeader('Allow', 'GET, OPTIONS'); send(405, { error: { code: 'method_not_allowed' } }); return; }
    try { send(200, await getData()); }
    catch (error) {
      const safe = error instanceof DonkiError ? error : new DonkiError('upstream_unavailable', 502);
      if (safe.retryAfter) response.setHeader('Retry-After', safe.retryAfter);
      send(safe.status, { error: { code: safe.code }, fallback: 'synthetic_demo' });
    }
  });
}
