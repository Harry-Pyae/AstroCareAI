export interface SolarFlare {
  flrID: string;
  beginTime: string;
  peakTime: string;
  classType: string;
}
export interface SpaceWeatherResponse {
  source: 'nasa_donki';
  upstream: 'nasa_gateway' | 'nasa_ccmc';
  fetchedAt: string;
  events: SolarFlare[];
}
export class DonkiError extends Error {
  code: string;
  status: number;
  retryAfter?: number;
  constructor(code: string, status: number, retryAfter?: number) {
    super(code); // Never keep an upstream body, URL, key or raw fetch error.
    this.code = code; this.status = status; this.retryAfter = retryAfter;
  }
}
export function normalizeEvents(data: unknown): SolarFlare[] {
  if (!Array.isArray(data)) throw new DonkiError('invalid_schema', 502);
  const events: SolarFlare[] = [];
  const seen = new Set<string>();
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (typeof row.flrID !== 'string' || !row.flrID || row.flrID.length > 200 ||
        typeof row.beginTime !== 'string' || !Number.isFinite(Date.parse(row.beginTime)) ||
        typeof row.peakTime !== 'string' || !Number.isFinite(Date.parse(row.peakTime)) ||
        Date.parse(row.peakTime) < Date.parse(row.beginTime) ||
        typeof row.classType !== 'string' || !/^[ABCMX]\d+(\.\d+)?$/.test(row.classType)) continue;
    if (seen.has(row.flrID)) continue;
    seen.add(row.flrID);
    events.push({ flrID: row.flrID, beginTime: row.beginTime, peakTime: row.peakTime, classType: row.classType });
  }
  if (data.length && !events.length) throw new DonkiError('invalid_schema', 502);
  return events.sort((a, b) => Date.parse(b.peakTime) - Date.parse(a.peakTime)).slice(0, 3);
}
async function parseResponse(response: Response): Promise<SolarFlare[]> {
  if (response.status === 429) {
    const raw = response.headers.get('retry-after');
    const delay = raw && /^\d+$/.test(raw) ? Number(raw) : 60;
    throw new DonkiError('rate_limited', 429, Math.min(Math.max(delay, 1), 3600));
  }
  if (response.status === 401 || response.status === 403) throw new DonkiError('key_rejected', 502);
  if (response.status >= 300 && response.status < 400) throw new DonkiError('upstream_redirect', 502);
  if (!response.ok) throw new DonkiError('upstream_unavailable', 502);
  const contentType = response.headers.get('content-type') ?? '';
  if (!/^application\/(?:[\w.-]+\+)?json\b/i.test(contentType)) throw new DonkiError('invalid_content_type', 502);
  // Bound body reads, even if Content-Length is missing or incorrect.
  const reader = response.body?.getReader();
  if (!reader) throw new DonkiError('empty_response', 502);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2_000_000) { await reader.cancel(); throw new DonkiError('response_too_large', 502); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (!size) throw new DonkiError('empty_response', 502);
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let data: unknown;
  try { data = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new DonkiError('invalid_json', 502); }
  return normalizeEvents(data);
}
export async function fetchSpaceWeather(apiKey: string, options: { fetchImpl?: typeof fetch; timeoutMs?: number; now?: Date } = {}): Promise<SpaceWeatherResponse> {
  if (!apiKey.trim()) throw new DonkiError('not_configured', 503);
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? new Date();
  const signal = AbortSignal.timeout(options.timeoutMs ?? 8000);
  const dates = { startDate: new Date(now.getTime() - 60 * 86_400_000).toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
  const gateway = new URL('https://api.nasa.gov/DONKI/FLR');
  gateway.search = new URLSearchParams({ ...dates, api_key: apiKey }).toString();
  let upstream: SpaceWeatherResponse['upstream'] = 'nasa_gateway';
  try {
    let events: SolarFlare[];
    try {
      events = await parseResponse(await fetchImpl(gateway, { signal, redirect: 'manual', headers: { Accept: 'application/json' } }));
    } catch (error) {
      // The documented migration currently redirects the old gateway to HTML.
      // Never follow arbitrary Location headers or forward the gateway key.
      if (!(error instanceof DonkiError) || !['upstream_redirect', 'invalid_content_type'].includes(error.code)) throw error;
      upstream = 'nasa_ccmc';
      const ccmc = new URL('https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR');
      ccmc.search = new URLSearchParams(dates).toString();
      events = await parseResponse(await fetchImpl(ccmc, { signal, redirect: 'manual', headers: { Accept: 'application/json' } }));
    }
    return { source: 'nasa_donki', upstream, fetchedAt: new Date().toISOString(), events };
  } catch (error) {
    if (signal.aborted) throw new DonkiError('timeout', 504);
    if (error instanceof DonkiError) throw error;
    throw new DonkiError('network_failure', 502);
  }
}
