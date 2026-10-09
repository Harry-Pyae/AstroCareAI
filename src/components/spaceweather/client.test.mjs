// Offline fixtures exercise the browser contract; none represent live NASA events.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getLastSuccessfulRetrieval, latestSuccessfulRetrieval, loadSpaceWeather, recentFlares, rememberSuccessfulRetrieval, retainGenuineResult, spaceWeatherLabel } from './client.ts';

const fallback = recentFlares(JSON.parse(readFileSync(new URL('../../data/spaceweather-fallback.json', import.meta.url), 'utf8')));
const flare = { flrID: 'offline-test-FLR-001', beginTime: '2026-10-01T00:00Z', peakTime: '2026-10-01T00:10Z', classType: 'C1.0' };
const envelope = events => ({ source: 'nasa_donki', upstream: 'nasa_ccmc', freshness: 'live', fetchedAt: '2026-10-09T00:00:00Z', events });
const load = response => loadSpaceWeather(fallback, new AbortController().signal, async () => response);
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
function assertFallback(state, code) {
  assert.equal(state.cached, true);
  assert.equal(state.delivery, 'synthetic');
  assert.equal(spaceWeatherLabel(state.delivery), 'Demonstration Data');
  assert.equal(state.errorCode, code);
  assert.deepEqual(state.events, fallback);
  assert.match(state.message, /synthetic demo/);
  assert.equal(state.fetchedAt, undefined);
  assert.ok(state.message in read('../../i18n/en.json'));
  assert.ok(state.message in read('../../i18n/my.json'));
}

test('browser requests only the same-origin proxy and strips nonpublic NASA fields', async () => {
  const controller = new AbortController();
  const state = await loadSpaceWeather(fallback, controller.signal, async (url, options) => {
    assert.equal(url, '/api/space-weather');
    assert.equal(options.signal, controller.signal);
    assert.deepEqual(options.headers, { Accept: 'application/json' });
    return Response.json(envelope([{ ...flare, privateField: 'discarded', link: 'https://nasa.gov/event?api_key=private-value' }]));
  });
  assert.equal(state.cached, false);
  assert.equal(state.delivery, 'live_nasa');
  assert.equal(spaceWeatherLabel(state.delivery), 'Live NASA Data');
  assert.deepEqual(state.events, [flare]);
  assert.equal(state.errorCode, undefined);
  assert.equal(JSON.stringify(state).includes('private-value'), false);
});

test('an empty successful NASA result stays empty instead of inventing events', async () => {
  const state = await load(Response.json(envelope([])));
  assert.equal(state.cached, false);
  assert.equal(state.delivery, 'live_nasa');
  assert.deepEqual(state.events, []);
  assert.equal(state.errorCode, undefined);
  assert.match(state.message, /No solar flare events/);
});

test('known HTTP failures preserve a specific safe explanation and synthetic fallback', async () => {
  const cases = [[504, 'timeout', 'timeout'], [503, 'not_configured', 'not_configured'],
    [503, 'schema_unverified', 'schema_unverified'],
    [502, 'key_rejected', 'key_rejected'], [502, 'network_failure', 'network_failure'],
    ...['invalid_json', 'invalid_schema', 'invalid_content_type', 'empty_response', 'response_too_large', 'upstream_redirect'].map(code => [502, code, 'invalid_response']),
    [502, 'upstream_unavailable', 'upstream_unavailable']];
  for (const [status, code, expected] of cases) {
    const state = await load(Response.json({ error: { code, detail: 'https://private.example?api_key=never-display' }, fallback: 'synthetic_demo' }, { status }));
    assertFallback(state, expected);
    assert.equal(JSON.stringify(state).includes('never-display'), false);
  }
});

test('rate-limit retry delays are bounded and missing delays back off', async () => {
  for (const [header, seconds] of [['45', 45], ['999999999999', 3600], ['0', 1], [undefined, 60], ['malformed', 60]]) {
    const state = await load(Response.json({ error: { code: 'rate_limited' } }, { status: 429, headers: header ? { 'Retry-After': header } : {} }));
    assertFallback(state, 'rate_limited');
    assert.equal(state.retryAfterSeconds, seconds);
  }
  const date = new Date(Date.now() + 5000).toUTCString();
  const state = await load(Response.json({ error: { code: 'rate_limited' } }, { status: 429, headers: { 'Retry-After': date } }));
  assert.ok(state.retryAfterSeconds >= 4 && state.retryAfterSeconds <= 5);
});

test('HTML, malformed JSON and invalid successful envelopes show an honest invalid-response fallback', async () => {
  const responses = [new Response('<html>private response</html>', { headers: { 'Content-Type': 'text/html' } }),
    new Response('{malformed', { headers: { 'Content-Type': 'application/json' } }),
    Response.json(null), Response.json({ ...envelope([]), source: 'fabricated' }),
    Response.json({ ...envelope([]), fetchedAt: 'invalid' }), Response.json(envelope([{ ...flare, classType: 'invalid' }]))];
  for (const response of responses) assertFallback(await load(response), 'invalid_response');
});

test('unknown failure codes and raw network errors never become visible error details', async () => {
  const response = Response.json({ error: { code: 'api_key=private-value', message: 'private-value' } }, { status: 502 });
  const unknown = await load(response);
  assertFallback(unknown, 'upstream_unavailable');
  const failed = await loadSpaceWeather(fallback, new AbortController().signal, async () => { throw new Error('private-value in request URL'); });
  assertFallback(failed, 'upstream_unavailable');
  assert.equal(JSON.stringify([unknown, failed]).includes('private-value'), false);
});

test('aborted requests distinguish a timeout and a subsequent request can recover', async () => {
  const first = new AbortController();
  first.abort();
  const failure = await loadSpaceWeather(fallback, first.signal, async (_url, options) => {
    assert.equal(options.signal.aborted, true);
    throw new DOMException('Aborted', 'AbortError');
  });
  assertFallback(failure, 'timeout');
  const retry = new AbortController();
  const recovered = await loadSpaceWeather(fallback, retry.signal, async (_url, options) => {
    assert.equal(options.signal.aborted, false);
    return Response.json(envelope([flare]));
  });
  assert.equal(recovered.cached, false);
  assert.equal(recovered.errorCode, undefined);
  assert.deepEqual(recovered.events, [flare]);
});

test('warm NASA cache keeps the original retrieval time and is never labeled live or synthetic', async () => {
  const state = await load(Response.json({ ...envelope([flare]), freshness: 'cached' }));
  assert.equal(state.delivery, 'cached_nasa');
  assert.equal(state.cached, false, 'Legacy cached flag denotes the synthetic fallback only');
  assert.equal(spaceWeatherLabel(state.delivery), 'Cached NASA Data');
  assert.equal(state.fetchedAt, envelope([]).fetchedAt);
  assert.deepEqual(state.events, [flare]);
  const empty = await load(Response.json({ ...envelope([]), freshness: 'cached' }));
  assert.equal(empty.delivery, 'cached_nasa');
  assert.deepEqual(empty.events, []);
});

test('unknown or absent freshness/upstream cannot produce a live NASA label', async () => {
  for (const change of [{ freshness: 'synthetic' }, { freshness: undefined }, { upstream: 'unverified' }, { upstream: undefined }, { source: 'synthetic_demo' }]) {
    assertFallback(await load(Response.json({ ...envelope([flare]), ...change })), 'invalid_response');
  }
});

test('last successful retrieval survives failures and older caches without using attempt or synthetic timestamps', async () => {
  const live = await load(Response.json(envelope([flare])));
  const failure = await load(Response.json({ error: { code: 'timeout' } }, { status: 504 }));
  const older = await load(Response.json({ ...envelope([flare]), freshness: 'cached', fetchedAt: '2026-10-08T00:00:00Z' }));
  const newer = await load(Response.json({ ...envelope([]), fetchedAt: '2026-10-10T00:00:00Z' }));
  assert.equal(latestSuccessfulRetrieval(undefined, failure), undefined, 'No timestamp before actual success');
  assert.equal(latestSuccessfulRetrieval(undefined, live), live.fetchedAt);
  assert.equal(latestSuccessfulRetrieval(live.fetchedAt, failure), live.fetchedAt);
  assert.equal(latestSuccessfulRetrieval(live.fetchedAt, older), live.fetchedAt);
  assert.equal(latestSuccessfulRetrieval(live.fetchedAt, newer), newer.fetchedAt);
  assert.equal(latestSuccessfulRetrieval(live.fetchedAt, { ...failure, fetchedAt: '2026-10-11T00:00:00Z' }), live.fetchedAt, 'Synthetic response cannot advance retrieval');
  assert.equal(latestSuccessfulRetrieval(live.fetchedAt, { ...live, fetchedAt: 'invalid' }), live.fetchedAt);
  assert.equal(getLastSuccessfulRetrieval(), undefined, 'Loader does not implicitly write browser session metadata');
  assert.equal(rememberSuccessfulRetrieval(live), live.fetchedAt);
  assert.equal(rememberSuccessfulRetrieval(failure), live.fetchedAt);
  assert.equal(getLastSuccessfulRetrieval(), live.fetchedAt, 'A remounted card can read the last genuine result');
});

const categoryEvent = type => ({ id: `offline-test-${type}-001`, eventType: type, occurredAt: flare.peakTime, classification: type === 'FLR' ? flare.classType : null });
const category = (type, events = [categoryEvent(type)], extra = {}) => ({ eventType: type, status: 'available', events,
  totalCount: events.length, fetchedAt: envelope([]).fetchedAt, upstream: 'nasa_ccmc', ...extra });
const unavailableCategory = (type, code = 'timeout', retryAfterSeconds) => ({ eventType: type, status: 'unavailable', events: [], totalCount: 0,
  error: { code, ...(retryAfterSeconds ? { retryAfterSeconds } : {}) } });
const multiEnvelope = categories => ({ ...envelope([flare]), categories, partial: categories.some(row => row.status === 'unavailable'),
  window: { startDate: '2026-08-10', endDate: '2026-10-09' } });

test('all four genuine event types retain explicit source, requested range, normalized data and total counts', async () => {
  const types = ['FLR', 'CME', 'GST', 'SEP'];
  const categories = types.map(type => category(type));
  categories[1] = category('CME', [1, 2, 3].map(id => ({ ...categoryEvent('CME'), id: `offline-test-CME-${id}` })), { totalCount: 8 });
  const state = await load(Response.json(multiEnvelope(categories)));
  assert.equal(state.delivery, 'live_nasa');
  assert.equal(state.partial, false);
  assert.deepEqual(state.categories.map(row => row.eventType), types);
  assert.equal(state.categories.find(row => row.eventType === 'CME').totalCount, 8, 'Three visible records are not the total');
  assert.deepEqual(state.window, { startDate: '2026-08-10', endDate: '2026-10-09' });
  assert.equal(state.categories.find(row => row.eventType === 'SEP').events[0].classification, null, 'No invented non-flare classification');
});

test('partial and mixed-provider success preserves available NASA types and explains unavailable types without fabrication', async () => {
  const categories = [category('FLR'), unavailableCategory('CME', 'rate_limited', 9000), category('GST', undefined, { upstream: 'nasa_gateway' }), category('SEP')];
  const state = await load(Response.json({ ...multiEnvelope(categories), upstream: 'mixed' }));
  assert.equal(state.delivery, 'live_nasa');
  assert.equal(state.partial, true);
  assert.match(state.message, /some event types/);
  const missing = state.categories.find(row => row.eventType === 'CME');
  assert.equal(missing.status, 'unavailable');
  assert.deepEqual(missing.events, []);
  assert.equal(missing.fetchedAt, undefined);
  assert.equal(state.retryAfterSeconds, 3600);
});

test('malformed category identities, counts, timestamps, classes, partial flags and requested dates cannot claim NASA success', async () => {
  const types = ['FLR', 'CME', 'GST', 'SEP'];
  const make = () => types.map(type => category(type));
  const invalid = [];
  let rows = make(); rows[1] = rows[0]; invalid.push(multiEnvelope(rows));
  rows = make(); rows[1].totalCount = -1; invalid.push(multiEnvelope(rows));
  rows = make(); rows[1].totalCount = 6; invalid.push(multiEnvelope(rows));
  rows = make(); rows[1].events[0].occurredAt = 'invalid'; invalid.push(multiEnvelope(rows));
  rows = make(); rows[0].events[0].classification = 'very dangerous'; invalid.push(multiEnvelope(rows));
  rows = make(); rows[1].events[0].classification = '<script>'; invalid.push(multiEnvelope(rows));
  invalid.push({ ...multiEnvelope(make()), partial: true });
  invalid.push({ ...multiEnvelope(make()), categories: [] });
  invalid.push({ ...multiEnvelope(make()), upstream: 'mixed' });
  invalid.push({ ...multiEnvelope(make()), window: { startDate: '2026-02-31', endDate: '2026-10-09' } });
  invalid.push({ ...multiEnvelope(make()), window: { startDate: '2026-10-10', endDate: '2026-10-09' } });
  for (const payload of invalid) assertFallback(await load(Response.json(payload)), 'invalid_response');
});

test('empty genuine results for all four types stay empty with retrieval metadata', async () => {
  const state = await load(Response.json({ ...multiEnvelope(['FLR', 'CME', 'GST', 'SEP'].map(type => category(type, []))), events: [] }));
  assert.equal(state.delivery, 'live_nasa');
  assert.equal(state.partial, false);
  assert.ok(state.categories.every(row => row.status === 'available' && row.totalCount === 0 && !row.events.length));
  assert.equal(state.fetchedAt, envelope([]).fetchedAt);
  assert.match(state.message, /No recent space-weather events/);
});

test('legacy FLR success does not fabricate availability or events for other types', async () => {
  const state = await load(Response.json(envelope([flare])));
  assert.equal(state.categories.find(row => row.eventType === 'FLR').status, 'available');
  assert.ok(state.categories.filter(row => row.eventType !== 'FLR').every(row => row.status === 'unavailable' && !row.events.length));
  assert.equal(state.partial, true);
});

test('all-type failures preserve type-specific safe issues and only existing demonstration flares', async () => {
  const categories = ['FLR', 'CME', 'GST', 'SEP'].map(type => unavailableCategory(type, type === 'GST' ? 'rate_limited' : 'timeout', 30));
  const state = await load(Response.json({ error: { code: 'timeout' }, categories }, { status: 504 }));
  assertFallback(state, 'timeout');
  assert.equal(state.categories.find(row => row.eventType === 'GST').error.code, 'rate_limited');
  assert.ok(state.categories.filter(row => row.eventType !== 'FLR').every(row => !row.events.length && !row.fetchedAt));
  assert.deepEqual(state.categories.find(row => row.eventType === 'FLR').events.map(row => row.id), fallback.map(row => row.flrID));
  const none = await loadSpaceWeather([], new AbortController().signal, async () => Response.json({ error: { code: 'timeout' }, categories }, { status: 504 }));
  assert.equal(none.delivery, 'unavailable');
  assert.equal(spaceWeatherLabel(none.delivery), 'NASA Data Unavailable');
  assert.ok(none.categories.every(row => row.status === 'unavailable' && !row.events.length));
  assert.equal(none.fetchedAt, undefined);
  assert.equal(none.message.includes('synthetic'), false, 'No demonstration data is claimed when none exists');
});

test('failed refresh retains only previous genuine NASA data as cached and never advances successful retrieval', async () => {
  const live = await load(Response.json(multiEnvelope(['FLR', 'CME', 'GST', 'SEP'].map(type => category(type)))));
  const failure = await load(Response.json({ error: { code: 'timeout' } }, { status: 504 }));
  const retained = retainGenuineResult(live, failure);
  assert.equal(retained.delivery, 'cached_nasa');
  assert.equal(spaceWeatherLabel(retained.delivery), 'Cached NASA Data');
  assert.equal(retained.errorCode, 'timeout');
  assert.equal(retained.retained, true);
  assert.deepEqual(retained.categories, live.categories);
  assert.equal(retained.fetchedAt, live.fetchedAt);
  assert.equal(latestSuccessfulRetrieval(live.fetchedAt, retained), live.fetchedAt);
  assert.equal(retained.message.includes('synthetic'), false);
  assert.equal(retainGenuineResult(failure, failure), failure, 'Synthetic data is never promoted to cached NASA');
});

test('unverified type schemas stay explicitly unavailable instead of being reported as network errors', async () => {
  const categories = [category('FLR'), ...['CME', 'GST', 'SEP'].map(type => unavailableCategory(type, 'schema_unverified'))];
  const state = await load(Response.json(multiEnvelope(categories)));
  assert.equal(state.partial, true);
  assert.deepEqual(state.categories.filter(row => row.eventType !== 'FLR').map(row => row.error.code), ['schema_unverified', 'schema_unverified', 'schema_unverified']);
  assert.ok(state.categories.filter(row => row.eventType !== 'FLR').every(row => !row.events.length && !row.fetchedAt));
});
