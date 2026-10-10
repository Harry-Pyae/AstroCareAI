// node src/components/spaceweather/api.test.mjs — offline: fetch is stubbed, NASA is never called.
import assert from 'node:assert/strict';

const flare = { flrID: '2026-10-09T13:55:00-FLR-001', beginTime: '2026-10-09T13:55Z', peakTime: '2026-10-09T14:09Z', classType: 'M1.3', note: 'dropped', link: 'dropped' };
const ok = () => new Response(JSON.stringify([flare, { flrID: 7 }]), { status: 200 });
let calls = [];
let version = 0;
// Each case gets a fresh module so the 10-minute module-scope cache starts empty.
async function handler(env, replies) {
  for (const name of ['DONKI_FLR_URL', 'NASA_API_KEY', 'NASA_API_KEY_FALLBACK']) delete process.env[name];
  Object.assign(process.env, env);
  calls = [];
  globalThis.fetch = async url => { calls.push(new URL(url)); const reply = replies.shift(); if (!reply) throw new TypeError('network'); return reply(); };
  console.warn = () => {};
  return (await import(`../../../api/space-weather.ts?case=${++version}`)).GET;
}

// Keyless default: one network failure, then the retry succeeds.
let GET = await handler({ NASA_API_KEY: 'secret' }, [null, ok]);
let response = await GET();
assert.equal(response.status, 200);
assert.equal(response.headers.get('cache-control'), 's-maxage=600, stale-while-revalidate=1800');
const body = await response.json();
assert.equal(body.source, 'nasa_donki');
assert.ok(Number.isFinite(Date.parse(body.fetchedAt)));
assert.deepEqual(body.events, [{ flrID: flare.flrID, beginTime: flare.beginTime, peakTime: flare.peakTime, classType: flare.classType }]);
assert.equal(calls.length, 2);
assert.ok(calls.every(url => url.hostname === 'ccmc.gsfc.nasa.gov' && !url.searchParams.has('api_key')), 'no key is sent to CCMC');
assert.equal((Date.parse(calls[0].searchParams.get('endDate')) - Date.parse(calls[0].searchParams.get('startDate'))) / 86_400_000, 60);
// Served from the module cache: no second upstream request.
assert.deepEqual(await (await GET()).json(), body);
assert.equal(calls.length, 2);

// Keyed endpoint: 403 and 429 advance NASA_API_KEY → NASA_API_KEY_FALLBACK → DEMO_KEY.
const denied = status => () => new Response('{}', { status });
GET = await handler({ DONKI_FLR_URL: 'https://api.nasa.gov/DONKI/FLR', NASA_API_KEY: 'first', NASA_API_KEY_FALLBACK: 'second' }, [denied(403), denied(429), ok]);
assert.equal((await GET()).status, 200);
assert.deepEqual(calls.map(url => url.searchParams.get('api_key')), ['first', 'second', 'DEMO_KEY']);

// An HTML page (the retired api.nasa.gov redirect) is skipped, not retried with more keys.
GET = await handler({}, [null, null, () => new Response('<!DOCTYPE html>', { status: 200 })]);
response = await GET();
assert.equal(response.status, 502);
assert.equal(response.headers.get('cache-control'), 'no-store');
assert.deepEqual(await response.json(), { error: 'upstream_unavailable' });
assert.deepEqual(calls.map(url => url.hostname), ['ccmc.gsfc.nasa.gov', 'ccmc.gsfc.nasa.gov', 'api.nasa.gov']);

console.log('space-weather function: all checks passed');
