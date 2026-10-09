// Deterministic fixtures are test data, never displayed as NASA live events.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { DonkiError, fetchSpaceWeather, normalizeEvents } from './donki.ts';
import { createProxyServer } from './http.ts';
import { loadSpaceWeather, recentFlares } from '../src/components/spaceweather/client.ts';

const fixture = { flrID: '2026-10-01T00:00:00-FLR-001', beginTime: '2026-10-01T00:00Z', peakTime: '2026-10-01T00:10Z', classType: 'C1.0' };
const json = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const failure = code => error => error instanceof DonkiError && error.code === code && !error.message.includes('test-only-key');

test('normalizes only valid fields, sorts/deduplicates, and preserves legitimate empty results', async () => {
  assert.deepEqual(normalizeEvents([{ ...fixture, privateField: 'never send' }, fixture, { bad: true }]), [fixture]);
  assert.deepEqual(normalizeEvents([]), []);
  assert.throws(() => normalizeEvents({ events: [] }), failure('invalid_schema'));
  assert.throws(() => normalizeEvents([{ ...fixture, peakTime: 'invalid' }]), failure('invalid_schema'));
  const data = await fetchSpaceWeather('test-only-key', { fetchImpl: async () => json([fixture]) });
  assert.deepEqual(data.events, [fixture]);
  assert.equal(data.upstream, 'nasa_gateway');
});
test('invalid/empty JSON is rejected and credentials are not in errors', async () => {
  for (const [body, code] of [['{malformed', 'invalid_json'], ['', 'empty_response']]) {
    await assert.rejects(fetchSpaceWeather('test-only-key', { fetchImpl: async () => new Response(body, { headers: { 'Content-Type': 'application/json' } }) }), failure(code));
  }
});
test('redirect and HTML migration use only official CCMC URL without forwarding key', async () => {
  for (const first of [new Response(null, { status: 302, headers: { Location: 'https://untrusted.example/' } }), new Response('<html/>', { headers: { 'Content-Type': 'text/html' } })]) {
    let calls = 0;
    const data = await fetchSpaceWeather('test-only-key', { fetchImpl: async (url, init) => {
      assert.equal(init.redirect, 'manual');
      if (++calls === 1) { assert.equal(url.searchParams.get('api_key'), 'test-only-key'); return first; }
      assert.equal(url.origin + url.pathname, 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR');
      assert.equal(url.searchParams.has('api_key'), false);
      return json([fixture]);
    } });
    assert.equal(data.upstream, 'nasa_ccmc');
    assert.equal(calls, 2);
  }
});
test('missing key, rejected key, upstream errors, rate limit, and timeout are handled', async () => {
  await assert.rejects(fetchSpaceWeather(''), failure('not_configured'));
  for (const [status, code] of [[401, 'key_rejected'], [403, 'key_rejected'], [500, 'upstream_unavailable'], [429, 'rate_limited']]) {
    let calls = 0;
    await assert.rejects(fetchSpaceWeather('test-only-key', { fetchImpl: async () => { calls++; return new Response(null, { status, headers: { 'Retry-After': '120' } }); } }), failure(code));
    assert.equal(calls, 1, 'Never bypass key rejection or rate limits with public endpoint');
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
  const live = await loadSpaceWeather(fallback, new AbortController().signal, async () => json({ source: 'nasa_donki', fetchedAt: new Date().toISOString(), events: [] }));
  assert.equal(live.cached, false);
  assert.deepEqual(live.events, []);
});
test('HTTP endpoint restricts CORS/methods, caches success, and serializes safe errors', async () => {
  let calls = 0;
  const server = createProxyServer({ frontendOrigin: 'http://127.0.0.1:5181', load: async () => { calls++; return { source: 'nasa_donki', upstream: 'nasa_gateway', fetchedAt: new Date().toISOString(), events: [fixture] }; } });
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
    await fetch(endpoint); assert.equal(calls, 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
  const broken = createProxyServer({ frontendOrigin: 'http://127.0.0.1:5181', load: async () => { throw new DonkiError('rate_limited', 429, 45); } });
  broken.listen(0, '127.0.0.1'); await once(broken, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${broken.address().port}/api/space-weather`);
    assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '45');
    assert.deepEqual(await response.json(), { error: { code: 'rate_limited' }, fallback: 'synthetic_demo' });
  } finally { await new Promise(resolve => broken.close(resolve)); }
});
