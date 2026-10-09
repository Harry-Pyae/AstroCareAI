import type { DonkiUpstream, SolarFlare, SpaceWeatherCategory, SpaceWeatherEvent, SpaceWeatherResponse, SpaceWeatherType } from './space-weather-types.ts';
export type { DonkiUpstream, SolarFlare, SpaceWeatherCategory, SpaceWeatherEvent, SpaceWeatherIssue, SpaceWeatherResponse, SpaceWeatherType, SpaceWeatherWindow } from './space-weather-types.ts';
export const DONKI_EVENT_TYPES: readonly SpaceWeatherType[] = ['FLR', 'CME', 'GST', 'SEP'];
// A migration redirect must not consume the current endpoint's request budget.
export const DONKI_ATTEMPT_TIMEOUT_MS = 8_000;
export const DONKI_MAX_REQUEST_MS = DONKI_ATTEMPT_TIMEOUT_MS * 2;
export class DonkiError extends Error {
  code: string;
  status: number;
  retryAfter?: number;
  categories?: SpaceWeatherCategory[];
  constructor(code: string, status: number, retryAfter?: number) {
    super(code); // Never keep an upstream body, URL, key or raw fetch error.
    this.code = code; this.status = status; this.retryAfter = retryAfter;
  }
}
function nasaLink(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2000) return;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password
      && (url.hostname === 'nasa.gov' || url.hostname.endsWith('.nasa.gov'))
      && ![...url.searchParams.keys()].some(key => /key|token|secret/i.test(key))) return url.href;
  } catch { /* Invalid upstream links are omitted. */ }
}
function timestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 64 && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
}
function normalizeAllFlares(data: unknown): SolarFlare[] {
  if (!Array.isArray(data)) throw new DonkiError('invalid_schema', 502);
  const events: SolarFlare[] = [];
  const seen = new Set<string>();
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (typeof row.flrID !== 'string' || !row.flrID.trim() || row.flrID.length > 200 || /[\u0000-\u001f\u007f]/.test(row.flrID) ||
        !timestamp(row.beginTime) || !timestamp(row.peakTime) ||
        Date.parse(row.peakTime) < Date.parse(row.beginTime) ||
        typeof row.classType !== 'string' || !/^[ABCMX]\d+(\.\d+)?$/.test(row.classType)) continue;
    if (seen.has(row.flrID)) continue;
    seen.add(row.flrID);
    const event: SolarFlare = { flrID: row.flrID, beginTime: row.beginTime, peakTime: row.peakTime, classType: row.classType };
    if (timestamp(row.submissionTime)) event.submissionTime = row.submissionTime;
    const link = nasaLink(row.link);
    if (link) event.link = link;
    events.push(event);
  }
  if (data.length && !events.length) throw new DonkiError('invalid_schema', 502);
  return events.sort((a, b) => Date.parse(b.peakTime) - Date.parse(a.peakTime));
}
// Compatibility for existing FLR consumers and the seeded synthetic fallback.
export function normalizeEvents(data: unknown): SolarFlare[] { return normalizeAllFlares(data).slice(0, 3); }
export function normalizeCategoryEvents(data: unknown, eventType: SpaceWeatherType): { events: SpaceWeatherEvent[]; totalCount: number } {
  if (!Array.isArray(data)) throw new DonkiError('invalid_schema', 502);
  if (eventType !== 'FLR') {
    // Official paths/date parameters are verified, but current primary response
    // schemas could not be retrieved. Do not guess identity or time mappings.
    if (data.length) throw new DonkiError('schema_unverified', 503);
    return { events: [], totalCount: 0 };
  }
  const flares = normalizeAllFlares(data);
  return {
    totalCount: flares.length,
    events: flares.slice(0, 3).map(flare => ({
      id: flare.flrID, eventType, occurredAt: flare.peakTime, classification: flare.classType,
      ...(flare.submissionTime ? { submissionTime: flare.submissionTime } : {}),
      ...(flare.link ? { link: flare.link } : {}),
    })),
  };
}
async function parseResponse(response: Response, signal: AbortSignal): Promise<unknown> {
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
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new DonkiError('timeout', 504);
      const { value, done } = await reader.read();
      if (signal.aborted) throw new DonkiError('timeout', 504);
      if (done) break;
      size += value.length;
      if (size > 2_000_000) { await reader.cancel(); throw new DonkiError('response_too_large', 502); }
      chunks.push(value);
    }
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
  if (!size) throw new DonkiError('empty_response', 502);
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let data: unknown;
  try { data = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new DonkiError('invalid_json', 502); }
  return data;
}
async function requestEvents(url: URL, fetchImpl: typeof fetch, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  let response: Response | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new DonkiError('timeout', 504));
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      (async () => {
        response = await fetchImpl(url, { signal: controller.signal, redirect: 'manual', headers: { Accept: 'application/json' } });
        return parseResponse(response, controller.signal);
      })(), deadline,
    ]);
  } catch (error) {
    // Node may time out while establishing the connection before our deadline.
    const cause = error && typeof error === 'object' && 'cause' in error ? error.cause : undefined;
    if (controller.signal.aborted || (cause && typeof cause === 'object' && 'code' in cause
      && ['UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'ETIMEDOUT'].includes(String(cause.code)))) {
      throw new DonkiError('timeout', 504);
    }
    if (error instanceof DonkiError) throw error;
    throw new DonkiError('network_failure', 502);
  } finally {
    clearTimeout(timer);
    // Release unconsumed redirect/HTML bodies; never follow their Location.
    controller.abort();
    void response?.body?.cancel().catch(() => {});
  }
}
export async function fetchSpaceWeather(apiKey: string, options: { fetchImpl?: typeof fetch; timeoutMs?: number; now?: Date } = {}): Promise<SpaceWeatherResponse> {
  if (!apiKey.trim()) throw new DonkiError('not_configured', 503);
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? new Date();
  const timeoutMs = options.timeoutMs ?? DONKI_ATTEMPT_TIMEOUT_MS;
  const dates = { startDate: new Date(now.getTime() - 60 * 86_400_000).toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
  const outcomes = await Promise.all(DONKI_EVENT_TYPES.map(async eventType => {
    let upstream: DonkiUpstream = 'nasa_gateway';
    try {
      const gateway = new URL(`https://api.nasa.gov/DONKI/${eventType}`);
      gateway.search = new URLSearchParams({ ...dates, api_key: apiKey }).toString();
      let data: unknown;
      try {
        data = await requestEvents(gateway, fetchImpl, timeoutMs);
      } catch (error) {
        // The documented migration currently redirects the old gateway to HTML.
        // Never follow arbitrary Location headers or forward the gateway key.
        if (!(error instanceof DonkiError) || !['upstream_redirect', 'invalid_content_type'].includes(error.code)) throw error;
        upstream = 'nasa_ccmc';
        const ccmc = new URL(`https://ccmc.gsfc.nasa.gov/DONKI-API/get/${eventType}`);
        ccmc.search = new URLSearchParams(dates).toString();
        data = await requestEvents(ccmc, fetchImpl, timeoutMs);
      }
      const normalized = normalizeCategoryEvents(data, eventType);
      const category: SpaceWeatherCategory = { eventType, status: 'available', ...normalized, fetchedAt: new Date().toISOString(), upstream };
      return { category, flares: eventType === 'FLR' ? normalizeEvents(data) : [], error: undefined };
    } catch (error) {
      const issue = error instanceof DonkiError ? error : new DonkiError('upstream_unavailable', 502);
      const category: SpaceWeatherCategory = {
        eventType, status: 'unavailable', events: [], totalCount: 0,
        error: { code: issue.code, ...(issue.retryAfter === undefined ? {} : { retryAfterSeconds: issue.retryAfter }) },
      };
      return { category, flares: [], error: issue };
    }
  }));
  const categories = outcomes.map(outcome => outcome.category);
  const available = categories.filter(category => category.status === 'available');
  if (!available.length) {
    const errors = outcomes.map(outcome => outcome.error).filter((error): error is DonkiError => error !== undefined);
    const rateLimits = errors.filter(error => error.code === 'rate_limited').sort((a, b) => (b.retryAfter ?? 60) - (a.retryAfter ?? 60));
    const issue = rateLimits[0] ?? errors.find(error => error.code === 'timeout') ?? errors[0];
    const error = new DonkiError(issue.code, issue.status, issue.retryAfter);
    error.categories = categories;
    throw error;
  }
  const sources = new Set(available.map(category => category.upstream));
  const upstream = sources.size > 1 ? 'mixed' : available[0].upstream!;
  return {
    source: 'nasa_donki', upstream, freshness: 'live', fetchedAt: new Date().toISOString(),
    events: outcomes.find(outcome => outcome.category.eventType === 'FLR')!.flares,
    categories, partial: available.length !== DONKI_EVENT_TYPES.length, window: dates,
  };
}
