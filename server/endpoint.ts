import { DonkiError, type SpaceWeatherResponse } from './donki.ts';

// Shared by the local HTTP server and Vercel. Memory caching is best effort
// within one warm instance; correctness never depends on a persistent cache.
export function createSpaceWeatherHandler(options: {
  load: () => Promise<SpaceWeatherResponse>;
  frontendOrigin?: string;
  cacheMs?: number;
}) {
  let cached: SpaceWeatherResponse | undefined;
  let expires = 0;
  let pending: Promise<SpaceWeatherResponse> | undefined;
  let cooldown: { error: DonkiError; until: number } | undefined;
  async function getData() {
    if (cached && Date.now() < expires) return cached;
    if (cooldown && Date.now() < cooldown.until) throw cooldown.error;
    if (!pending) {
      pending = options.load().then(data => {
        cached = data;
        expires = Date.now() + (options.cacheMs ?? 60_000);
        cooldown = undefined;
        return data;
      }).catch(error => {
        const safe = error instanceof DonkiError ? error : new DonkiError('upstream_unavailable', 502);
        cooldown = { error: safe, until: Date.now() + (safe.retryAfter ?? 10) * 1000 };
        throw safe;
      }).finally(() => { pending = undefined; });
    }
    return pending;
  }
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const allowedOrigin = options.frontendOrigin ?? url.origin;
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Origin',
    });
    const send = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers });
    const origin = request.headers.get('origin');
    if (origin && origin !== allowedOrigin) return send(403, { error: { code: 'origin_not_allowed' } });
    if (origin) headers.set('Access-Control-Allow-Origin', allowedOrigin);
    // No client-selected date, URL or key can turn this into an open proxy.
    if (url.pathname !== '/api/space-weather' || url.search) return send(404, { error: { code: 'not_found' } });
    if (request.method === 'OPTIONS') {
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Accept');
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'GET') {
      headers.set('Allow', 'GET, OPTIONS');
      return send(405, { error: { code: 'method_not_allowed' } });
    }
    try { return send(200, await getData()); }
    catch (error) {
      const safe = error instanceof DonkiError ? error : new DonkiError('upstream_unavailable', 502);
      if (safe.retryAfter) headers.set('Retry-After', String(safe.retryAfter));
      return send(safe.status, { error: { code: safe.code }, fallback: 'synthetic_demo' });
    }
  };
}
