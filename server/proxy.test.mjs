// Deterministic fixtures are test data, never displayed as NASA live events.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { DONKI_EVENT_TYPES, DonkiError, fetchSpaceWeather, normalizeCategoryEvents, normalizeEvents } from './donki.ts';
import { createProxyServer } from './http.ts';
import { loadSpaceWeather, recentFlares } from '../src/components/spaceweather/client.ts';

const fixture = { flrID: '2026-10-01T00:00:00-FLR-001', beginTime: '2026-10-01T00:00Z', peakTime: '2026-10-01T00:10Z', classType: 'C1.0' };
const json = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const eventType = url => url.pathname.split('/').at(-1);
const fixtureResponse = url => json(eventType(url) === 'FLR' ? [fixture] : []);
const failure = code => error => error instanceof DonkiError && error.code === code && !error.message.includes('test-only-key');

test('normalizes only valid fields, sorts/deduplicates, and preserves legitimate empty results', async () => {
  assert.deepEqual(normalizeEvents([{ ...fixture, privateField: 'never send' }, fixture, { bad: true }]), [fixture]);
  assert.deepEqual(normalizeEvents([]), []);
  const metadata = { ...fixture, submissionTime: '2026-10-01T01:00Z', link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/1' };
  assert.deepEqual(normalizeEvents([metadata]), [metadata]);
  assert.deepEqual(recentFlares([metadata]), [metadata]);
  for (const link of ['https://untrusted.example/event', 'https://nasa.gov/?api_key=test-only-key', 'https://user:password@nasa.gov/']) {
    assert.equal(normalizeEvents([{ ...fixture, link }])[0].link, undefined);
    assert.equal(recentFlares([{ ...fixture, link }])[0].link, undefined);
  }
  assert.throws(() => normalizeEvents({ events: [] }), failure('invalid_schema'));
  assert.throws(() => normalizeEvents([{ ...fixture, peakTime: 'invalid' }]), failure('invalid_schema'));
  const data = await fetchSpaceWeather('test-only-key', { fetchImpl: async url => fixtureResponse(url) });
  assert.deepEqual(data.events, [fixture]);
  assert.equal(data.upstream, 'nasa_gateway');
  assert.equal(data.freshness, 'live');
  assert.equal(data.partial, false);
  assert.deepEqual(data.categories.map(category => category.eventType), DONKI_EVENT_TYPES);
  assert.ok(data.categories.every(category => category.status === 'available'));
});
test('verified FLR normalization and unverified category schemas never invent events or classifications', () => {
  const input = { ...fixture, submissionTime: '2026-10-01T01:00Z', link: 'https://ccmc.gsfc.nasa.gov/DONKI/', privateField: 'never send' };
  const normalized = normalizeCategoryEvents([input, input, { invalid: true }], 'FLR');
  assert.deepEqual(normalized, { totalCount: 1, events: [{ id: fixture.flrID, eventType: 'FLR', occurredAt: fixture.peakTime, classification: fixture.classType, submissionTime: input.submissionTime, link: input.link }] });
  for (const eventType of DONKI_EVENT_TYPES) {
    assert.deepEqual(normalizeCategoryEvents([], eventType), { events: [], totalCount: 0 });
    assert.throws(() => normalizeCategoryEvents({ events: [] }, eventType), failure('invalid_schema'));
    assert.throws(() => normalizeCategoryEvents([{ unverified: true }], eventType), failure(eventType === 'FLR' ? 'invalid_schema' : 'schema_unverified'));
  }
  const many = Array.from({ length: 5 }, (_, index) => ({ ...fixture, flrID: `offline-FLR-${index}`, beginTime: `2026-10-0${index + 1}T00:00Z`, peakTime: `2026-10-0${index + 1}T00:10Z` }));
  const sample = normalizeCategoryEvents([...many, many[0]], 'FLR');
  assert.equal(sample.totalCount, 5, 'Count is validated unique events before the three-row display limit');
  assert.deepEqual(sample.events.map(event => event.id), ['offline-FLR-4', 'offline-FLR-3', 'offline-FLR-2']);
  for (const event of [{ ...fixture, flrID: '' }, { ...fixture, flrID: 'x'.repeat(201) }, { ...fixture, peakTime: 'invalid' }, { ...fixture, flrID: 'offline\nFLR' }]) {
    assert.throws(() => normalizeCategoryEvents([event], 'FLR'), failure('invalid_schema'));
  }
});
test('independent categories preserve partial real data and mixed upstream attribution', async () => {
  const fetched = Date.now();
  const result = await fetchSpaceWeather('test-only-key', { now: new Date('2026-10-09T00:00:00Z'), fetchImpl: async url => {
    const type = eventType(url);
    assert.equal(url.searchParams.get('startDate'), '2026-08-10');
    assert.equal(url.searchParams.get('endDate'), '2026-10-09');
    if (type === 'GST') return new Response(null, { status: 429, headers: { 'Retry-After': '120' } });
    if (type === 'SEP') return new Response('{malformed', { headers: { 'Content-Type': 'application/json' } });
    if (type === 'CME') {
      if (url.hostname === 'api.nasa.gov') return new Response(null, { status: 301 });
      return json([]);
    }
    return fixtureResponse(url);
  } });
  assert.equal(result.partial, true);
  assert.equal(result.upstream, 'mixed');
  assert.deepEqual(result.events, [fixture]);
  assert.deepEqual(result.window, { startDate: '2026-08-10', endDate: '2026-10-09' });
  assert.ok(Date.parse(result.fetchedAt) >= fetched, 'Timestamp records actual completion, not injected query date');
  const categories = Object.fromEntries(result.categories.map(category => [category.eventType, category]));
  assert.equal(categories.FLR.status, 'available');
  assert.equal(categories.FLR.upstream, 'nasa_gateway');
  assert.equal(categories.CME.upstream, 'nasa_ccmc');
  assert.deepEqual(categories.CME.events, [], 'Genuine empty results stay empty, without inferred classifications');
  assert.equal(categories.CME.totalCount, 0);
  assert.deepEqual(categories.GST.error, { code: 'rate_limited', retryAfterSeconds: 120 });
  assert.equal(categories.SEP.error.code, 'invalid_json');
  for (const type of ['GST', 'SEP']) {
    assert.deepEqual(categories[type].events, []);
    assert.equal(categories[type].totalCount, 0);
    assert.equal(categories[type].fetchedAt, undefined, 'Unavailable data has no invented retrieval time');
  }
});
test('nonempty unverified categories stay explicit partial failures without guessed field mappings', async () => {
  const result = await fetchSpaceWeather('test-only-key', { fetchImpl: async url => json(eventType(url) === 'FLR' ? [fixture] : [{ unverified: true }]) });
  assert.equal(result.partial, true);
  assert.deepEqual(result.events, [fixture]);
  for (const category of result.categories.filter(category => category.eventType !== 'FLR')) {
    assert.equal(category.status, 'unavailable');
    assert.deepEqual(category.error, { code: 'schema_unverified' });
    assert.deepEqual(category.events, []);
    assert.equal(category.totalCount, 0);
    assert.equal(category.fetchedAt, undefined);
  }
});
test('all failed categories preserve individual causes and prioritize a safe rate-limit response', async () => {
  await assert.rejects(fetchSpaceWeather('test-only-key', { timeoutMs: 10, fetchImpl: async url => {
    if (eventType(url) === 'GST') return new Response(null, { status: 429, headers: { 'Retry-After': '45' } });
    if (eventType(url) === 'SEP') return new Response('{invalid', { headers: { 'Content-Type': 'application/json' } });
    if (eventType(url) === 'CME') return new Response(null, { status: 403 });
    return new Promise(() => {});
  } }), error => {
    assert.ok(failure('rate_limited')(error));
    assert.equal(error.status, 429);
    assert.equal(error.retryAfter, 45);
    assert.deepEqual(error.categories.map(category => category.error.code), ['timeout', 'key_rejected', 'rate_limited', 'invalid_json']);
    assert.ok(error.categories.every(category => category.status === 'unavailable' && category.totalCount === 0 && !category.events.length));
    assert.equal(JSON.stringify(error.categories).includes('test-only-key'), false);
    return true;
  });
});
test('invalid/empty JSON is rejected and credentials are not in errors', async () => {
  for (const [body, code] of [['{malformed', 'invalid_json'], ['', 'empty_response']]) {
    await assert.rejects(fetchSpaceWeather('test-only-key', { fetchImpl: async () => new Response(body, { headers: { 'Content-Type': 'application/json' } }) }), failure(code));
  }
});
test('redirect and HTML migration use only official CCMC URL without forwarding key', async () => {
  for (const migration of ['redirect', 'html']) {
    let calls = 0;
    const data = await fetchSpaceWeather('test-only-key', { fetchImpl: async (url, init) => {
      assert.equal(init.redirect, 'manual');
      calls++;
      assert.ok(DONKI_EVENT_TYPES.includes(eventType(url)));
      if (url.hostname === 'api.nasa.gov') {
        assert.equal(url.searchParams.get('api_key'), 'test-only-key');
        return migration === 'redirect' ? new Response(null, { status: 302, headers: { Location: 'https://untrusted.example/' } }) : new Response('<html/>', { headers: { 'Content-Type': 'text/html' } });
      }
      assert.equal(url.origin + url.pathname, `https://ccmc.gsfc.nasa.gov/DONKI-API/get/${eventType(url)}`);
      assert.equal(url.searchParams.has('api_key'), false);
      return fixtureResponse(url);
    } });
    assert.equal(data.upstream, 'nasa_ccmc');
    assert.equal(calls, 8);
    assert.equal(data.partial, false);
    assert.ok(data.categories.every(category => category.upstream === 'nasa_ccmc'));
  }
});
test('missing key, rejected key, upstream errors, rate limit, and timeout are handled', async () => {
  await assert.rejects(fetchSpaceWeather(''), failure('not_configured'));
  for (const [status, code] of [[401, 'key_rejected'], [403, 'key_rejected'], [500, 'upstream_unavailable'], [429, 'rate_limited']]) {
    let calls = 0;
    await assert.rejects(fetchSpaceWeather('test-only-key', { fetchImpl: async () => { calls++; return new Response(null, { status, headers: { 'Retry-After': '120' } }); } }), failure(code));
    assert.equal(calls, 4, 'Each type makes one gateway call; rejected keys/rate limits never bypass it');
  }
  await assert.rejects(fetchSpaceWeather('test-only-key', { timeoutMs: 10, fetchImpl: async (_, { signal }) => new Promise((resolve, reject) => {
    const keepAlive = setTimeout(() => resolve(json([])), 1000);
    signal.addEventListener('abort', () => { clearTimeout(keepAlive); reject(new Error('Raw secret error must be suppressed')); }, { once: true });
  }) }), failure('timeout'));
});
test('frontend preserves synthetic fallback on failure; empty live results stay empty', async () => {
  const fallback = recentFlares(JSON.parse(readFileSync(new URL('../src/data/spaceweather-fallback.json', import.meta.url), 'utf8')));
  for (const fetchImpl of [async () => new Response(null, { status: 502 }), async () => new Response('<html/>', { headers: { 'Content-Type': 'text/html' } }), async () => { throw new Error('Timed out'); }]) {
    const state = await loadSpaceWeather(fallback, new AbortController().signal, fetchImpl);
    assert.equal(state.cached, true);
    assert.deepEqual(state.events, fallback);
    assert.match(state.message, /synthetic demo/);
  }
  const limited = await loadSpaceWeather(fallback, new AbortController().signal, async () => new Response(null, { status: 429 }));
  assert.match(limited.message, /rate limit/);
  const live = await loadSpaceWeather(fallback, new AbortController().signal, async () => json({ source: 'nasa_donki', upstream: 'nasa_ccmc', freshness: 'live', fetchedAt: new Date().toISOString(), events: [] }));
  assert.equal(live.cached, false);
  assert.deepEqual(live.events, []);
});
test('migration has a fresh bounded budget and releases both upstream connections', async () => {
  const signals = [];
  let redirectCancelled = false;
  const result = await fetchSpaceWeather('test-only-key', { timeoutMs: 100, fetchImpl: async (_url, { signal }) => {
    assert.equal(signal.aborted, false);
    signals.push(signal);
    await new Promise(resolve => setTimeout(resolve, 60));
    if (_url.hostname === 'api.nasa.gov') return new Response(new ReadableStream({ cancel() { redirectCancelled = true; } }), { status: 301 });
    assert.equal(signals[0].aborted, true);
    return fixtureResponse(_url);
  } });
  assert.equal(result.upstream, 'nasa_ccmc');
  assert.equal(signals.length, 8);
  assert.notEqual(signals[0], signals[4]);
  assert.ok(signals.every(signal => signal.aborted));
  assert.equal(redirectCancelled, true);
});
test('deadline covers stalled fetches and streamed bodies, not only response headers', async () => {
  await assert.rejects(fetchSpaceWeather('test-only-key', { timeoutMs: 10, fetchImpl: () => new Promise(() => {}) }), failure('timeout'));
  let cancelled = false;
  await assert.rejects(fetchSpaceWeather('test-only-key', { timeoutMs: 10, fetchImpl: async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('[')); },
    cancel() { cancelled = true; },
  }), { headers: { 'Content-Type': 'application/json' } }) }), failure('timeout'));
  assert.equal(cancelled, true);
});
test('native connection timeouts stay distinct from other network failures without exposing details', async () => {
  for (const networkCode of ['UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'ETIMEDOUT', 'ENOTFOUND']) {
    let calls = 0;
    await assert.rejects(fetchSpaceWeather('test-only-key', { fetchImpl: async () => {
      calls++;
      throw new Error('private URL with test-only-key', { cause: { code: networkCode } });
    } }), failure(networkCode === 'ENOTFOUND' ? 'network_failure' : 'timeout'));
    assert.equal(calls, 4, 'Each type makes one gateway call; network failures never bypass it');
  }
});
test('HTTP endpoint restricts CORS/methods, caches success, and serializes safe errors', async () => {
  let calls = 0;
  const server = createProxyServer({ frontendOrigin: 'http://127.0.0.1:5181', load: async () => { calls++; return { source: 'nasa_donki', upstream: 'nasa_gateway', freshness: 'live', fetchedAt: new Date().toISOString(), events: [fixture] }; } });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const endpoint = `http://127.0.0.1:${server.address().port}/api/space-weather`;
  try {
    const bad = await fetch(endpoint, { headers: { Origin: 'https://unapproved.example' } });
    assert.equal(bad.status, 403); assert.equal(bad.headers.has('access-control-allow-origin'), false);
    assert.equal(calls, 0);
    assert.equal((await fetch(endpoint, { method: 'POST' })).status, 405);
    const response = await fetch(endpoint, { headers: { Origin: 'http://127.0.0.1:5181' } });
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5181');
    assert.deepEqual((await response.json()).events, [fixture]);
    const hit = await fetch(endpoint);
    assert.equal((await hit.json()).freshness, 'cached');
    assert.equal(calls, 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
  const broken = createProxyServer({ frontendOrigin: 'http://127.0.0.1:5181', load: async () => { throw new DonkiError('rate_limited', 429, 45); } });
  broken.listen(0, '127.0.0.1'); await once(broken, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${broken.address().port}/api/space-weather`);
    assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '45');
    assert.deepEqual(await response.json(), { error: { code: 'rate_limited' }, fallback: 'synthetic_demo' });
  } finally { await new Promise(resolve => broken.close(resolve)); }
});
