import test from 'node:test';
import assert from 'node:assert/strict';
import {
  setStorageNamespace, saveCheckin, saveCheckinEntry, saveCheckinEntryResult,
  getCheckins, getCheckinDetails, getDecisions, getStorageReadStatus, saveDecision,
  resetDemoData, resetUserData, readDemoState, writeDemoState,
  DEMO_STATE_KEY, LEGACY_DEMO_STATE_KEY,
} from './storage.ts';

function browser() {
  const values = new Map();
  const events = [];
  globalThis.window = { dispatchEvent: event => { events.push(event.type); return true; }, localStorage: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  } };
  setStorageNamespace('');
  return { values, events };
}
const crewId = 'ac-pay-05';
const time = Date.parse('2030-04-03T12:00:00Z');
const obs = (metric = 'sleep_hours', value = 7, timestamp = time) => ({ crewId, metric, value, timestamp: new Date(timestamp).toISOString(), provenance: 'user_checkin' });
const details = (timestamp = time) => ({ crewId, timestamp: new Date(timestamp).toISOString(), fatigue: 2, note: 'Synthetic test', sleepQuality: 4, stress: 2, hydrationLiters: 2, symptoms: ['none'] });

test('atomic multi-reading check-in validates all entries, notifies, and preserves all details', () => {
  const { values, events } = browser();
  const rows = [obs(), obs('exercise_min', 35), obs('mood', 4)];
  assert.equal(saveCheckinEntryResult(rows, details()), 'saved');
  assert.equal(getCheckins(crewId).length, 3);
  assert.deepEqual(getCheckinDetails(crewId), [details()]);
  assert.equal(JSON.parse(values.get('astrocare:v1:state')).version, 2);
  assert.deepEqual(events, ['storage']);
  const before = values.get('astrocare:v1:state');
  assert.equal(saveCheckinEntryResult([obs('sleep_hours', 7, time + 360000), obs('hrv', 50, time + 360000)], details(time + 360000)), 'invalid');
  assert.equal(values.get('astrocare:v1:state'), before, 'invalid array must not partially save');
});

test('single-reading compatibility and five-minute duplicate boundary return honest outcomes', () => {
  browser();
  assert.equal(saveCheckinEntry(obs(), details()), true);
  assert.equal(saveCheckinEntryResult(obs('sleep_hours', 8, time + 299999), details(time + 299999)), 'duplicate');
  assert.equal(saveCheckinEntryResult(obs('sleep_hours', 8, time + 300000), details(time + 300000)), 'saved');
  assert.equal(getCheckins(crewId).length, 2);
  assert.equal(saveCheckinEntryResult([], details()), 'invalid');
  assert.equal(saveCheckinEntryResult([obs(), obs()], details()), 'invalid');
  for (const row of [obs('hrv', 55), obs('radiation_msv', 0.3), obs('sleep_hours', 25), obs('exercise_min', 601), obs('mood', 0)]) {
    assert.equal(saveCheckin(row), false);
    assert.equal(saveCheckinEntryResult(row, details()), 'invalid');
  }
  assert.equal(saveCheckinEntryResult(obs(), { ...details(), symptoms: ['none', 'headache'] }), 'invalid');
});

test('v1 records survive additive migration to v2 and original timestamps remain unchanged', () => {
  const { values } = browser();
  const original = obs();
  const oldDetails = { crewId, timestamp: original.timestamp, fatigue: 2, note: 'Original v1 note' };
  values.set('astrocare:v1:state', JSON.stringify({ version: 1, checkins: [original], decisions: [], details: [oldDetails] }));
  assert.deepEqual(getCheckins(crewId), [original]);
  assert.deepEqual(getCheckinDetails(crewId), [oldDetails]);
  assert.equal(saveDecision({ crewId, action: 'request_review', note: 'Review', timestamp: original.timestamp }), true);
  const migrated = JSON.parse(values.get('astrocare:v1:state'));
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.checkins, [original]);
  assert.deepEqual(migrated.details, [oldDetails]);
});

test('successful writes remain successful when notifications fail; blocked persistence is unavailable', () => {
  const { values } = browser();
  window.dispatchEvent = () => { throw new Error('No event dispatcher'); };
  assert.equal(saveCheckinEntryResult(obs(), details()), 'saved');
  assert.equal(getCheckins(crewId).length, 1);
  const before = values.get('astrocare:v1:state');
  window.localStorage.setItem = () => { throw new Error('Storage blocked'); };
  assert.equal(saveCheckinEntryResult(obs('sleep_hours', 7, time + 600000), details(time + 600000)), 'unavailable');
  assert.equal(values.get('astrocare:v1:state'), before);
});

test('read status distinguishes empty history from blocked or corrupt history without changing either scope', () => {
  const { values, events } = browser();
  assert.equal(getStorageReadStatus(), 'available', 'No saved records is readable');
  assert.deepEqual(getCheckins(crewId), []);
  assert.equal(values.size, 0, 'Read check does not create an envelope');
  values.set('astrocare:v1:state', '{corrupt-json');
  const corrupt = values.get('astrocare:v1:state');
  assert.equal(getStorageReadStatus(''), 'unavailable');
  assert.deepEqual(getCheckins(crewId, ''), [], 'Legacy getter signature stays unchanged');
  assert.equal(values.get('astrocare:v1:state'), corrupt, 'Corrupt records are preserved for recovery');
  setStorageNamespace('demo:');
  assert.equal(getStorageReadStatus(), 'available', 'An empty demo scope is independent of corrupt user history');
  assert.equal(getStorageReadStatus(''), 'unavailable', 'Explicit user scope still reports failure');
  values.set('demo:astrocare:v1:state', JSON.stringify({ version: 99, checkins: [], decisions: [], details: [] }));
  assert.equal(getStorageReadStatus(), 'unavailable', 'Unsupported envelopes are unavailable');
  const before = new Map(values);
  window.localStorage.getItem = () => { throw new Error('Reads blocked'); };
  assert.equal(getStorageReadStatus(), 'unavailable');
  assert.deepEqual(values, before, 'Blocked reads never reset stored history');
  Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('Storage access blocked'); } });
  assert.equal(getStorageReadStatus(), 'unavailable', 'Blocked property access is handled');
  assert.deepEqual(events, [], 'Read status has no write notifications');
});

test('demo/user reset helpers preserve the other scope and canonical inactive mode wins over legacy active mode', () => {
  const { values } = browser();
  saveCheckin(obs());
  setStorageNamespace('demo:');
  saveCheckin(obs('sleep_hours', 5.5));
  assert.equal(resetDemoData(), true);
  assert.equal(getCheckins(crewId, 'demo:').length, 0);
  assert.equal(getCheckins(crewId, '').length, 1);
  values.set(LEGACY_DEMO_STATE_KEY, JSON.stringify({ active: true, scenario: 'review' }));
  assert.deepEqual(readDemoState(), { active: true, scenario: 'reviewing' });
  writeDemoState({ active: false, scenario: 'stable' });
  assert.equal(values.has(DEMO_STATE_KEY), true);
  assert.deepEqual(readDemoState(), { active: false, scenario: 'stable' });
  assert.equal(resetUserData(), true);
  assert.deepEqual(getDecisions(crewId, ''), []);
  assert.equal(values.has(DEMO_STATE_KEY), true, 'record resets keep demo selection and UI settings');
});
