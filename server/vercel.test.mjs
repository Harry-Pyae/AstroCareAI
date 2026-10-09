// Offline serverless tests use explicit fixtures, never invented live events.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { createSpaceWeatherHandler } from './endpoint.ts';
import { DonkiError } from './donki.ts';
import { loadSpaceWeather, recentFlares } from '../src/components/spaceweather/client.ts';
import * as api from '../api/space-weather.ts';

const event = { flrID: 'offline-test-FLR-001', beginTime: '2026-10-01T00:00Z', peakTime: '2026-10-01T00:10Z', classType: 'C1.0' };
const data = { source: 'nasa_donki', upstream: 'nasa_gateway', fetchedAt: '2026-10-09T00:00:00Z', events: [event] };
const request = (origin, options = {}) => new Request(`${origin}/api/space-weather`, options);

test('production and preview same-origin requests work; cross-origin and arbitrary queries are rejected', async () => {
  let calls = 0;
  const handle = createSpaceWeatherHandler({ load: async () => { calls++; return data; } });
  for (const origin of ['https://astrocare.example', 'https://astrocare-preview.vercel.app']) {
    const response = await handle(request(origin, { headers: { Origin: origin } }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), data);
  }
  const rejected = await handle(request('https://astrocare.example', { headers: { Origin: 'https://foreign.example' } }));
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.has('access-control-allow-origin'), false);
  assert.equal((await handle(new Request('https://astrocare.example/api/space-weather?url=https://foreign.example'))).status, 404);
  assert.equal(calls, 1, 'Warm cache is reused, rejected requests never fetch');
});

test('serverless failures retain safe status/Retry-After and the frontend synthetic fallback', async () => {
  const fallback = recentFlares(JSON.parse(readFileSync(new URL('../src/data/spaceweather-fallback.json', import.meta.url), 'utf8')));
  for (const [code, status, retryAfter] of [['not_configured', 503], ['invalid_json', 502], ['timeout', 504], ['rate_limited', 429, 45]]) {
    let calls = 0;
    const handle = createSpaceWeatherHandler({ load: async () => { calls++; throw new DonkiError(code, status, retryAfter); } });
    const response = await handle(request('https://astrocare.example'));
    assert.equal(response.status, status);
    assert.deepEqual(await response.clone().json(), { error: { code }, fallback: 'synthetic_demo' });
    if (retryAfter) assert.equal(response.headers.get('retry-after'), String(retryAfter));
    const state = await loadSpaceWeather(fallback, new AbortController().signal, async () => response);
    assert.equal(state.cached, true);
    assert.deepEqual(state.events, fallback);
    assert.match(state.message, /synthetic demo/);
    await handle(request('https://astrocare.example'));
    assert.equal(calls, 1, 'Failures back off within a warm instance');
  }
  const unknown = createSpaceWeatherHandler({ load: async () => { throw new Error('private upstream detail'); } });
  const response = await unknown(request('https://astrocare.example'));
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes('private upstream detail'), false);
});

test('simultaneous cold requests coalesce without requiring persistent serverless state', async () => {
  let calls = 0;
  let finish;
  const handle = createSpaceWeatherHandler({ load: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
  const first = handle(request('https://astrocare.example'));
  const second = handle(request('https://astrocare.example'));
  assert.equal(calls, 1);
  finish(data);
  for (const response of await Promise.all([first, second])) assert.deepEqual(await response.json(), data);
  const coldInstance = createSpaceWeatherHandler({ load: async () => data });
  assert.equal((await coldInstance(request('https://astrocare.example'))).status, 200);
});

test('actual Vercel exports reuse DONKI normalization and return the unchanged frontend envelope', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.NASA_API_KEY;
  let calls = 0;
  process.env.NASA_API_KEY = 'offline-test-only-key';
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url.origin + url.pathname, 'https://api.nasa.gov/DONKI/FLR');
    assert.equal(url.searchParams.get('api_key'), 'offline-test-only-key');
    assert.equal(options.redirect, 'manual');
    return Response.json([{ ...event, privateField: 'discarded' }]);
  };
  try {
    const preflight = await api.OPTIONS(request('https://astrocare.example', { method: 'OPTIONS', headers: { Origin: 'https://astrocare.example' } }));
    assert.equal(preflight.status, 204);
    assert.equal(calls, 0);
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']) {
      const response = await api[method](request('https://astrocare.example', { method }));
      assert.equal(response.status, 405);
      assert.equal(response.headers.get('allow'), 'GET, OPTIONS');
    }
    const state = await loadSpaceWeather([], new AbortController().signal, async (url) => {
      assert.equal(url, '/api/space-weather');
      return api.GET(request('https://astrocare.example'));
    });
    assert.equal(state.cached, false);
    assert.deepEqual(state.events, [event]);
    assert.equal(JSON.stringify(state).includes('offline-test-only-key'), false);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.NASA_API_KEY;
    else process.env.NASA_API_KEY = originalKey;
  }
});

test('Vercel build config preserves SPA deep links alongside the API entrypoint', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(config.framework, 'vite');
  assert.equal(config.buildCommand, 'npm run build');
  assert.equal(config.outputDirectory, 'dist');
  assert.deepEqual(config.rewrites, [{ source: '/(.*)', destination: '/index.html' }]);
  assert.ok(config.functions['api/space-weather.ts'].maxDuration > 8);
  assert.equal(pkg.engines.node, '22.x');
  assert.ok(existsSync(new URL('../api/space-weather.ts', import.meta.url)));
  assert.equal(config.env, undefined, 'Secrets are managed outside source configuration');
});
