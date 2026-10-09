export interface SolarFlare { flrID: string; beginTime: string; peakTime: string; classType: string; }
export interface SpaceWeatherState { events: SolarFlare[]; cached: boolean; message: string; fetchedAt?: string; }
export function recentFlares(data: unknown): SolarFlare[] {
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  return data.filter((item): item is SolarFlare => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Record<string, unknown>;
    return typeof row.flrID === 'string' && row.flrID.length > 0 && typeof row.beginTime === 'string' && Number.isFinite(Date.parse(row.beginTime)) && typeof row.peakTime === 'string' && Number.isFinite(Date.parse(row.peakTime)) && Date.parse(row.peakTime) >= Date.parse(row.beginTime) && typeof row.classType === 'string' && /^[ABCMX]\d+(\.\d+)?$/.test(row.classType);
  }).sort((a, b) => Date.parse(b.peakTime) - Date.parse(a.peakTime)).filter(row => !seen.has(row.flrID) && Boolean(seen.add(row.flrID))).slice(0, 3);
}
export async function loadSpaceWeather(fallback: SolarFlare[], signal: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<SpaceWeatherState> {
  try {
    const response = await fetchImpl('/api/space-weather', { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return { events: fallback, cached: true, message: response.status === 429 ? 'NASA rate limit reached. Showing synthetic demo events.' : 'Live NASA data is unavailable. Showing synthetic demo events.' };
    if (!(response.headers.get('content-type') ?? '').includes('application/json')) throw new Error('Invalid response');
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') throw new Error('Invalid response');
    const body = data as Record<string, unknown>;
    if (body.source !== 'nasa_donki' || !Array.isArray(body.events) || typeof body.fetchedAt !== 'string' || !Number.isFinite(Date.parse(body.fetchedAt))) throw new Error('Invalid response');
    const events = recentFlares(body.events);
    if (body.events.length && !events.length) throw new Error('Invalid events');
    return { events, cached: false, fetchedAt: body.fetchedAt, message: events.length ? '' : 'No solar flare events were returned for the requested period.' };
  } catch {
    return { events: fallback, cached: true, message: 'Live NASA data is unavailable. Showing synthetic demo events.' };
  }
}
