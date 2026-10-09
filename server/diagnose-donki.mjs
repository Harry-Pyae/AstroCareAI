// Local diagnostic only. Never log keys, request URLs, raw bodies or fetch errors.
import { fetchSpaceWeather, normalizeEvents } from './donki.ts';
if (process.argv.includes('--all-types')) {
  const started = performance.now();
  console.log(JSON.stringify({ keyConfigured: Boolean(process.env.NASA_API_KEY?.trim()), mode: 'all_types' }));
  const observedFetch = async (url, init) => {
    const target = new URL(url);
    const eventType = target.pathname.split('/').at(-1);
    const stage = target.hostname === 'api.nasa.gov' ? 'gateway' : 'ccmc';
    const began = performance.now();
    try {
      const response = await fetch(url, init);
      console.log(JSON.stringify({ stage, eventType, status: response.status,
        contentType: response.headers.get('content-type')?.split(';')[0] ?? 'missing',
        headersMs: Math.round(performance.now() - began) }));
      return response;
    } catch (error) {
      // Upstream errors can embed the private gateway URL. Log no raw error.
      console.log(JSON.stringify({ stage, eventType, outcome: 'no_response_headers',
        elapsedMs: Math.round(performance.now() - began) }));
      throw error;
    }
  };
  try {
    const data = await fetchSpaceWeather(process.env.NASA_API_KEY ?? '', { fetchImpl: observedFetch });
    console.log(JSON.stringify({ outcome: 'validated_nasa_response', source: data.source,
      freshness: data.freshness, fetchedAt: data.fetchedAt, partial: data.partial,
      categories: data.categories.map(({ eventType, status, totalCount, fetchedAt, error }) =>
        ({ eventType, status, totalCount, fetchedAt, error })), totalMs: Math.round(performance.now() - started) }));
  } catch (error) {
    console.log(JSON.stringify({ outcome: 'nasa_unavailable', code: error.code, status: error.status,
      categories: error.categories, totalMs: Math.round(performance.now() - started) }));
    process.exitCode = 1;
  }
  process.exit(process.exitCode ?? 0);
}
const day = 86_400_000;
const now = new Date();
const dates = days => ({ startDate: new Date(now.getTime() - days * day).toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) });
const probes = [
  { stage: 'gateway_60_days', base: 'https://api.nasa.gov/DONKI/FLR', days: 60, key: true },
  { stage: 'ccmc_60_days', base: 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR', days: 60 },
  { stage: 'ccmc_7_days', base: 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR', days: 7 },
  { stage: 'legacy_ccmc_7_days', base: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR', days: 7 },
];
console.log(JSON.stringify({ node: process.version, keyConfigured: Boolean(process.env.NASA_API_KEY?.trim()), proxyEnvironmentPresent: Boolean(process.env.HTTPS_PROXY || process.env.HTTP_PROXY), timeoutMs: 15000 }));
for (const probe of probes) {
  if (probe.key && !process.env.NASA_API_KEY?.trim()) {
    console.log(JSON.stringify({ stage: probe.stage, outcome: 'not_configured' }));
    continue;
  }
  const url = new URL(probe.base);
  url.search = new URLSearchParams({ ...dates(probe.days), ...(probe.key ? { api_key: process.env.NASA_API_KEY } : {}) }).toString();
  const start = performance.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'manual', headers: { Accept: 'application/json' } });
    const headersMs = Math.round(performance.now() - start);
    const type = response.headers.get('content-type')?.split(';')[0] ?? 'missing';
    let classification = 'other';
    let eventCount;
    let validatedEventCount;
    let retrievedAt;
    let redirectHost;
    let redirectPath;
    if (response.status >= 300 && response.status < 400) {
      classification = 'redirect';
      try {
        const target = new URL(response.headers.get('location'), url);
        if (target.protocol === 'https:' && target.hostname.endsWith('.nasa.gov')) {
          redirectHost = target.hostname;
          // Log only known public paths, never a raw Location or query string.
          const paths = ['/DONKI/api', '/DONKI/api/', '/tools/DONKI/', '/DONKI/', '/DONKI-API/get/FLR', '/DONKI/WS/get/FLR'];
          redirectPath = paths.includes(target.pathname) ? target.pathname : 'other_nasa_path';
        } else redirectHost = 'unapproved_target';
      } catch { redirectHost = 'invalid_location'; }
    }
    else if (type.includes('html')) classification = 'html';
    else if (type.includes('json')) {
      const reader = response.body?.getReader();
      const chunks = [];
      let size = 0;
      if (reader) {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > 2_000_000) { await reader.cancel(); classification = 'response_too_large'; break; }
            chunks.push(value);
          }
        } finally { reader.releaseLock(); }
      }
      if (classification !== 'response_too_large') {
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
        try {
          const data = JSON.parse(new TextDecoder().decode(bytes));
          classification = Array.isArray(data) ? 'json_array' : 'json_object';
          if (Array.isArray(data)) {
            eventCount = data.length;
            if (response.ok) {
              try { validatedEventCount = normalizeEvents(data).length; retrievedAt = new Date().toISOString(); }
              catch { classification = 'invalid_event_schema'; }
            }
          }
        } catch { classification = size ? 'malformed_json' : 'empty'; }
      }
    }
    await response.body?.cancel().catch(() => {});
    console.log(JSON.stringify({ stage: probe.stage, status: response.status, contentType: type, classification, redirectHost, redirectPath, eventCount, validatedEventCount, retrievedAt, headersMs, totalMs: Math.round(performance.now() - start) }));
  } catch (error) {
    const cause = error?.cause?.code;
    const timedOut = error?.name === 'TimeoutError' || ['UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'ETIMEDOUT'].includes(cause);
    console.log(JSON.stringify({ stage: probe.stage, outcome: timedOut ? 'timeout' : 'network_failure', networkCode: typeof cause === 'string' && /^[A-Z_]{1,60}$/.test(cause) ? cause : undefined, totalMs: Math.round(performance.now() - start) }));
  }
}
