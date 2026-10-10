// Vercel serverless function: GET /api/space-weather
// Same-origin source for the space-weather card: the last 60 days of NASA DONKI
// solar flares, reduced to the fields in src/data/spaceweather-fallback.json.
// Context only; nothing here is linked to crew readings.

// No @types/node in this project; this is the only Node global used.
declare const process: { env: Record<string, string | undefined> };

// Verified 2026-10-10: CCMC returns the FLR JSON with no key. api.nasa.gov/DONKI
// now redirects to an HTML announcement page; it stays as a last resort only.
const CCMC = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR';
const NASA = 'https://api.nasa.gov/DONKI/FLR';
const CACHE_MS = 600_000;
const ATTEMPT_MS = 4000;

interface Flare { flrID: string; beginTime: string; peakTime: string; classType: string; }
interface Payload { source: 'nasa_donki'; fetchedAt: string; events: Flare[]; }
let cache: { at: number; body: Payload } | undefined;

const isoDay = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);

function normalize(data: unknown): Flare[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap(row => {
    const { flrID, beginTime, peakTime, classType } = (row ?? {}) as Record<string, unknown>;
    return typeof flrID === 'string' && typeof beginTime === 'string' && typeof peakTime === 'string' && typeof classType === 'string'
      ? [{ flrID, beginTime, peakTime, classType }] : [];
  });
}

async function attempt(base: string, key?: string): Promise<Flare[] | 'next-key' | 'next-endpoint'> {
  let url: URL;
  try { url = new URL(base); } catch { return 'next-endpoint'; }
  url.searchParams.set('startDate', isoDay(60));
  url.searchParams.set('endDate', isoDay(0));
  if (key) url.searchParams.set('api_key', key);
  let response: Response;
  try { response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(ATTEMPT_MS) }); }
  catch { console.warn(`space-weather: ${url.hostname} unreachable`); return 'next-key'; }
  // Log host and status only: the URL can carry an API key.
  if (!response.ok) console.warn(`space-weather: ${url.hostname} responded ${response.status}`);
  if ([401, 403, 429].includes(response.status)) return 'next-key';
  if (!response.ok) return 'next-endpoint';
  try {
    const events = normalize(await response.json());
    if (events.length) return events;
  } catch { /* Not JSON, e.g. a redirect to an HTML page. */ }
  console.warn(`space-weather: ${url.hostname} returned no usable events`);
  return 'next-endpoint';
}

async function load(): Promise<Flare[] | undefined> {
  const { DONKI_FLR_URL, NASA_API_KEY, NASA_API_KEY_FALLBACK } = process.env;
  const endpoints = [...new Set([DONKI_FLR_URL, CCMC, NASA].filter((value): value is string => Boolean(value)))];
  const keys = [...new Set([NASA_API_KEY, NASA_API_KEY_FALLBACK, 'DEMO_KEY'].filter(Boolean))];
  for (const endpoint of endpoints) {
    // Only api.nasa.gov takes a key. Keyless endpoints get one retry instead:
    // CCMC's TLS handshake resets intermittently.
    const tries = endpoint.includes('//api.nasa.gov/') ? keys : [undefined, undefined];
    for (const key of tries) {
      const result = await attempt(endpoint, key);
      if (Array.isArray(result)) return result;
      if (result === 'next-endpoint') break;
    }
  }
}

const json = (status: number, body: unknown, cacheControl: string) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cacheControl } });

export async function GET(): Promise<Response> {
  if (!cache || Date.now() - cache.at > CACHE_MS) {
    const events = await load();
    if (!events) return json(502, { error: 'upstream_unavailable' }, 'no-store');
    cache = { at: Date.now(), body: { source: 'nasa_donki', fetchedAt: new Date().toISOString(), events } };
  }
  return json(200, cache.body, 's-maxage=600, stale-while-revalidate=1800');
}
