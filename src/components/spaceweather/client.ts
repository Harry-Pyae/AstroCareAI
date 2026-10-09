import type { SolarFlare, SpaceWeatherCategory, SpaceWeatherEvent, SpaceWeatherType, SpaceWeatherWindow } from '../../../server/space-weather-types';
export type { SolarFlare, SpaceWeatherCategory, SpaceWeatherEvent, SpaceWeatherType } from '../../../server/space-weather-types';
export const SPACE_WEATHER_TYPES: SpaceWeatherType[] = ['FLR', 'CME', 'GST', 'SEP'];
export type SpaceWeatherError = 'timeout' | 'rate_limited' | 'not_configured' | 'key_rejected' | 'invalid_response' | 'network_failure' | 'upstream_unavailable' | 'schema_unverified';
export type SpaceWeatherDelivery = 'live_nasa' | 'cached_nasa' | 'synthetic' | 'unavailable';
export interface SpaceWeatherState {
  events: SolarFlare[];
  categories: SpaceWeatherCategory[];
  partial: boolean;
  window?: SpaceWeatherWindow;
  retained?: boolean;
  delivery: SpaceWeatherDelivery;
  /** Compatibility flag: true means the synthetic fallback, not NASA's warm cache. */
  cached: boolean;
  message: string;
  fetchedAt?: string;
  errorCode?: SpaceWeatherError;
  retryAfterSeconds?: number;
}
export function spaceWeatherLabel(delivery: SpaceWeatherDelivery): string {
  return delivery === 'live_nasa' ? 'Live NASA Data' : delivery === 'cached_nasa' ? 'Cached NASA Data'
    : delivery === 'synthetic' ? 'Demonstration Data' : 'NASA Data Unavailable';
}
/** A failed attempt, synthetic event date or older cache cannot advance this time. */
export function latestSuccessfulRetrieval(previous: string | undefined, state: SpaceWeatherState): string | undefined {
  const known = previous && Number.isFinite(Date.parse(previous)) ? previous : undefined;
  if ((state.delivery !== 'live_nasa' && state.delivery !== 'cached_nasa') || state.cached || state.errorCode || !state.fetchedAt || !Number.isFinite(Date.parse(state.fetchedAt))) return known;
  return !known || Date.parse(state.fetchedAt) > Date.parse(known) ? state.fetchedAt : known;
}
// Session memory keeps provenance across crew-card remounts. No personal storage is used.
let successfulRetrieval: string | undefined;
export function getLastSuccessfulRetrieval(): string | undefined { return successfulRetrieval; }
export function rememberSuccessfulRetrieval(state: SpaceWeatherState): string | undefined {
  successfulRetrieval = latestSuccessfulRetrieval(successfulRetrieval, state);
  return successfulRetrieval;
}
// Longer than the proxy's upstream budget; each mounted card owns its abort signal.
export const SPACE_WEATHER_TIMEOUT_MS = 22_000;
const errorMessages: Record<SpaceWeatherError, string> = {
  timeout: 'NASA request timed out. Showing synthetic demo events.',
  rate_limited: 'NASA rate limit reached. Showing synthetic demo events.',
  not_configured: 'Live NASA data is not configured on this server. Showing synthetic demo events.',
  key_rejected: 'NASA could not authorize this server. Showing synthetic demo events.',
  invalid_response: 'NASA returned an unusable response. Showing synthetic demo events.',
  network_failure: 'This server could not connect to NASA. Showing synthetic demo events.',
  upstream_unavailable: 'Live NASA data is unavailable. Showing synthetic demo events.',
  schema_unverified: 'Response fields have not been verified for this event type. Showing synthetic demo events.',
};
const errorDetails: Record<SpaceWeatherError, string> = {
  timeout: 'NASA request timed out.',
  rate_limited: 'NASA rate limit reached.',
  not_configured: 'NASA data is not configured on this server.',
  key_rejected: 'NASA could not authorize this server.',
  invalid_response: 'The space-weather response could not be validated.',
  network_failure: 'This server could not connect to NASA.',
  upstream_unavailable: 'NASA data is unavailable for this event type.',
  schema_unverified: 'Response fields have not been verified for this event type.',
};
function issueCode(code: unknown): SpaceWeatherError {
  if (code === 'timeout' || code === 'rate_limited' || code === 'not_configured' || code === 'key_rejected' || code === 'network_failure' || code === 'schema_unverified') return code;
  if (['invalid_json', 'invalid_schema', 'invalid_content_type', 'empty_response', 'response_too_large', 'upstream_redirect', 'invalid_response'].includes(String(code))) return 'invalid_response';
  return 'upstream_unavailable';
}
export function spaceWeatherIssueMessage(code: unknown): string { return errorDetails[issueCode(code)]; }
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const timestamp = (value: unknown): value is string => typeof value === 'string' && value.length <= 64 && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
function dateOnly(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function nasaLink(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2000) return;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password && (url.hostname === 'nasa.gov' || url.hostname.endsWith('.nasa.gov'))
      && ![...url.searchParams.keys()].some(key => /key|token|secret/i.test(key))) return url.href;
  } catch { /* Untrusted links never reach the browser. */ }
}
function validFlare(value: unknown): value is SolarFlare {
  return isRecord(value) && typeof value.flrID === 'string' && value.flrID.trim().length > 0 && value.flrID.length <= 200
    && timestamp(value.beginTime) && timestamp(value.peakTime) && Date.parse(value.peakTime) >= Date.parse(value.beginTime)
    && typeof value.classType === 'string' && /^[ABCMX]\d+(\.\d+)?$/.test(value.classType)
    && (value.submissionTime === undefined || timestamp(value.submissionTime));
}
function retryAfter(value: string | null): number | undefined {
  if (!value) return;
  const seconds = /^\d+$/.test(value) ? Number(value) : Math.ceil((Date.parse(value) - Date.now()) / 1000);
  return Number.isFinite(seconds) ? Math.min(Math.max(seconds, 1), 3600) : undefined;
}
/** Only fixed public codes can influence the UI; upstream details are never shown. */
async function responseError(response: Response): Promise<{ errorCode: SpaceWeatherError; categories?: SpaceWeatherCategory[] }> {
  let code: unknown;
  let categories: SpaceWeatherCategory[] | undefined;
  if (/^application\/(?:[\w.-]+\+)?json\b/i.test(response.headers.get('content-type') ?? '')) {
    try {
      const data: unknown = await response.json();
      if (isRecord(data)) {
        if (isRecord(data.error)) code = data.error.code;
        const parsed = parseCategories(data.categories);
        if (parsed?.every(item => item.status === 'unavailable')) categories = parsed;
      }
    } catch { /* An unreadable failure response remains unavailable. */ }
  }
  const errorCode = response.status === 429 ? 'rate_limited' : response.status === 504 ? 'timeout'
    : response.status === 503 && (code === 'not_configured' || code === 'schema_unverified') ? code
      : response.status === 502 ? issueCode(code) : 'upstream_unavailable';
  return { errorCode, categories };
}
export function recentFlares(data: unknown): SolarFlare[] {
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  return data.filter(validFlare).map(row => {
    const event: SolarFlare = { flrID: row.flrID, beginTime: row.beginTime, peakTime: row.peakTime, classType: row.classType };
    if (row.submissionTime) event.submissionTime = row.submissionTime;
    const link = nasaLink(row.link);
    if (link) event.link = link;
    return event;
  }).sort((a, b) => Date.parse(b.peakTime) - Date.parse(a.peakTime)).filter(row => !seen.has(row.flrID) && Boolean(seen.add(row.flrID))).slice(0, 3);
}
function eventFromFlare(flare: SolarFlare): SpaceWeatherEvent {
  return { id: flare.flrID, eventType: 'FLR', occurredAt: flare.peakTime, classification: flare.classType,
    ...(flare.submissionTime ? { submissionTime: flare.submissionTime } : {}), ...(flare.link ? { link: flare.link } : {}) };
}
function parseEvent(value: unknown, type: SpaceWeatherType): SpaceWeatherEvent | undefined {
  if (!isRecord(value) || value.eventType !== type || typeof value.id !== 'string' || !value.id.trim() || value.id.length > 200
    || !timestamp(value.occurredAt) || (value.submissionTime !== undefined && !timestamp(value.submissionTime))) return;
  if (value.classification !== null && (typeof value.classification !== 'string' || !value.classification.trim()
    || value.classification.length > 200 || /[<>\u0000-\u001f]/.test(value.classification))) return;
  if (type === 'FLR' && (typeof value.classification !== 'string' || !/^[ABCMX]\d+(\.\d+)?$/.test(value.classification))) return;
  const link = nasaLink(value.link);
  return { id: value.id, eventType: type, occurredAt: value.occurredAt, classification: value.classification as string | null,
    ...(typeof value.submissionTime === 'string' ? { submissionTime: value.submissionTime } : {}), ...(link ? { link } : {}) };
}
function parseCategories(value: unknown): SpaceWeatherCategory[] | undefined {
  if (!Array.isArray(value) || value.length !== SPACE_WEATHER_TYPES.length) return;
  const result: SpaceWeatherCategory[] = [];
  const seen = new Set<SpaceWeatherType>();
  for (const row of value) {
    if (!isRecord(row) || !SPACE_WEATHER_TYPES.includes(row.eventType as SpaceWeatherType)
      || seen.has(row.eventType as SpaceWeatherType) || !Array.isArray(row.events)
      || !Number.isSafeInteger(row.totalCount) || Number(row.totalCount) < 0) return;
    const type = row.eventType as SpaceWeatherType;
    seen.add(type);
    if (row.status === 'unavailable') {
      if (row.events.length || row.totalCount !== 0 || row.fetchedAt !== undefined || row.upstream !== undefined) return;
      const issue = isRecord(row.error) ? row.error : undefined;
      const wait = typeof issue?.retryAfterSeconds === 'number' && Number.isFinite(issue.retryAfterSeconds)
        ? Math.min(Math.max(Math.ceil(issue.retryAfterSeconds), 1), 3600) : undefined;
      result.push({ eventType: type, status: 'unavailable', events: [], totalCount: 0,
        error: { code: issueCode(issue?.code), ...(wait ? { retryAfterSeconds: wait } : {}) } });
    } else if (row.status === 'available') {
      if (!timestamp(row.fetchedAt) || (row.upstream !== 'nasa_gateway' && row.upstream !== 'nasa_ccmc')
        || row.error !== undefined || row.events.length !== Math.min(Number(row.totalCount), 3)) return;
      const events = row.events.map(item => parseEvent(item, type));
      if (events.some(item => !item) || new Set(events.map(item => item?.id)).size !== events.length) return;
      result.push({ eventType: type, status: 'available', events: (events as SpaceWeatherEvent[]).sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)),
        totalCount: Number(row.totalCount), fetchedAt: row.fetchedAt, upstream: row.upstream });
    } else return;
  }
  return SPACE_WEATHER_TYPES.map(type => result.find(row => row.eventType === type)!);
}
export function demonstrationSpaceWeather(fallback: SolarFlare[], errorCode?: SpaceWeatherError, retryAfterSeconds?: number, failures?: SpaceWeatherCategory[]): SpaceWeatherState {
  const flares = recentFlares(fallback);
  const categories: SpaceWeatherCategory[] = SPACE_WEATHER_TYPES.map(type => type === 'FLR' && flares.length
    ? { eventType: type, status: 'available', events: flares.map(eventFromFlare), totalCount: flares.length }
    : failures?.find(row => row.eventType === type) ?? { eventType: type, status: 'unavailable', events: [], totalCount: 0, error: { code: errorCode ?? 'upstream_unavailable' } });
  return { events: flares, categories, partial: true, delivery: flares.length ? 'synthetic' : 'unavailable', cached: flares.length > 0,
    message: errorCode ? (flares.length ? errorMessages[errorCode] : errorDetails[errorCode]) : '',
    ...(errorCode ? { errorCode } : {}), ...(retryAfterSeconds ? { retryAfterSeconds } : {}) };
}
/** Keep only previously genuine data, clearly cached, after a failed refresh. */
export function retainGenuineResult(previous: SpaceWeatherState, result: SpaceWeatherState): SpaceWeatherState {
  if ((previous.delivery !== 'live_nasa' && previous.delivery !== 'cached_nasa') || !result.errorCode) return result;
  return { ...previous, delivery: 'cached_nasa', cached: false, retained: true, errorCode: result.errorCode,
    retryAfterSeconds: result.retryAfterSeconds, message: errorDetails[result.errorCode] };
}
export async function loadSpaceWeather(fallback: SolarFlare[], signal: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<SpaceWeatherState> {
  const unavailable = (errorCode: SpaceWeatherError, retryAfterSeconds?: number, failures?: SpaceWeatherCategory[]) => demonstrationSpaceWeather(fallback, errorCode, retryAfterSeconds, failures);
  try {
    const response = await fetchImpl('/api/space-weather', { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) {
      const failure = await responseError(response);
      return unavailable(signal.aborted ? 'timeout' : failure.errorCode, retryAfter(response.headers.get('retry-after')) ?? (response.status === 429 ? 60 : undefined), failure.categories);
    }
    if (!/^application\/(?:[\w.-]+\+)?json\b/i.test(response.headers.get('content-type') ?? '')) return unavailable('invalid_response');
    let data: unknown;
    try { data = await response.json(); }
    catch { return unavailable(signal.aborted ? 'timeout' : 'invalid_response'); }
    if (!data || typeof data !== 'object') return unavailable('invalid_response');
    const body = data as Record<string, unknown>;
    if (body.source !== 'nasa_donki' || (body.upstream !== 'nasa_gateway' && body.upstream !== 'nasa_ccmc' && body.upstream !== 'mixed')
      || (body.freshness !== 'live' && body.freshness !== 'cached') || !Array.isArray(body.events)
      || !body.events.every(validFlare) || !timestamp(body.fetchedAt)) return unavailable('invalid_response');
    const flareRows = body.events as SolarFlare[];
    const events = recentFlares(flareRows);
    const legacy = body.categories === undefined;
    const categories = legacy ? SPACE_WEATHER_TYPES.map((type): SpaceWeatherCategory => type === 'FLR'
      ? { eventType: type, status: 'available', events: events.map(eventFromFlare), totalCount: new Set(flareRows.map(row => row.flrID)).size,
        fetchedAt: body.fetchedAt as string, upstream: body.upstream as 'nasa_gateway' | 'nasa_ccmc' }
      : { eventType: type, status: 'unavailable', events: [], totalCount: 0, error: { code: 'upstream_unavailable' } }) : parseCategories(body.categories);
    if (!categories || (legacy && body.upstream === 'mixed')) return unavailable('invalid_response');
    const available = categories.filter(row => row.status === 'available');
    const partial = available.length < SPACE_WEATHER_TYPES.length;
    const upstreams = new Set(available.map(row => row.upstream));
    const expectedUpstream = upstreams.size > 1 ? 'mixed' : available[0]?.upstream;
    if (!available.length || body.upstream !== expectedUpstream || (!legacy && (typeof body.partial !== 'boolean' || body.partial !== partial))) return unavailable('invalid_response');
    let window: SpaceWeatherWindow | undefined;
    if (body.window !== undefined) {
      if (!isRecord(body.window) || !dateOnly(body.window.startDate) || !dateOnly(body.window.endDate) || body.window.startDate > body.window.endDate) return unavailable('invalid_response');
      window = { startDate: body.window.startDate, endDate: body.window.endDate };
    }
    const wait = Math.max(0, ...categories.map(row => row.error?.retryAfterSeconds ?? 0));
    return { events, categories, partial, ...(window ? { window } : {}), delivery: body.freshness === 'live' ? 'live_nasa' : 'cached_nasa', cached: false,
      fetchedAt: body.fetchedAt, ...(wait ? { retryAfterSeconds: wait } : {}),
      message: legacy ? (events.length ? '' : 'No solar flare events were returned for the requested period.')
        : partial ? 'NASA data is unavailable for some event types. Available responses are shown.'
          : categories.every(row => row.totalCount === 0) ? 'No recent space-weather events were returned for the requested period.' : '' };
  } catch {
    return unavailable(signal.aborted ? 'timeout' : 'upstream_unavailable');
  }
}
