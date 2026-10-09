import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeDemoSession, changeDemoSession, rebaseScenarioData, DEMO_SCENARIO_KEY } from '../../lib/demo.ts';
import { saveCheckin, getCheckins, saveDecision, getDecisions, LEGACY_DEMO_STATE_KEY } from '../../lib/storage.ts';
import { computeBaselines } from '../../lib/baseline.ts';
import { SCENARIO_DATA, SCENARIO_IDS, buildScenarioDataset } from '../../data/scenarios/index.ts';

function browserStorage() {
  const values = new Map();
  globalThis.window = { localStorage: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  } };
  return values;
}
const now = Date.parse('2030-04-03T12:00:00.000Z');
const crewId = 'ac-cmdr-01';
const observation = (value, timestamp = now) => ({ crewId, metric: 'sleep_hours', value, timestamp: new Date(timestamp).toISOString(), provenance: 'user_checkin' });
const decision = note => ({ crewId, action: 'recheck', note, timestamp: new Date(now).toISOString() });

test('enter/switch/reset isolates records, increments revision, and exit restores normal records', () => {
  const values = browserStorage();
  let session = initializeDemoSession(now);
  const personal = observation(8);
  assert.equal(saveCheckin(personal), true);
  assert.equal(saveDecision(decision('Personal record')), true);
  const original = values.get('astrocare:v1:state');
  values.set('demo:unrelated-project', 'Preserve this unrelated key');
  session = changeDemoSession(session, { type: 'enter', scenario: 'reviewing' }, now);
  assert.deepEqual(getCheckins(crewId), []);
  assert.equal(saveCheckin(observation(5.5)), true);
  assert.equal(saveDecision(decision('Demo record')), true);
  assert.equal(getCheckins(crewId).length, 1);
  session = changeDemoSession(session, { type: 'scenario', scenario: 'incomplete' }, now + 1000);
  assert.equal(session.revision, 2);
  assert.deepEqual(getCheckins(crewId), []);
  assert.deepEqual(getDecisions(crewId), []);
  saveDecision(decision('Reset this'));
  session = changeDemoSession(session, { type: 'reset' }, now + 2000);
  assert.equal(session.revision, 3);
  assert.equal(session.scenario, 'incomplete');
  assert.deepEqual(getDecisions(crewId), []);
  assert.equal(values.get('astrocare:v1:state'), original);
  assert.equal(values.get('demo:unrelated-project'), 'Preserve this unrelated key');
  session = changeDemoSession(session, { type: 'exit' }, now + 3000);
  assert.equal(session.active, false);
  assert.deepEqual(getCheckins(crewId), [personal]);
  assert.equal(getDecisions(crewId)[0].note, 'Personal record');
  assert.equal(changeDemoSession(session, { type: 'reset' }), session);
});

test('deep-link reload restores the namespace synchronously and migrates the legacy scenario name', () => {
  const values = browserStorage();
  values.set(LEGACY_DEMO_STATE_KEY, 'review');
  const loaded = initializeDemoSession(now);
  assert.equal(loaded.active, true);
  assert.equal(loaded.scenario, 'reviewing');
  saveCheckin(observation(6));
  assert.equal(values.has('demo:astrocare:v1:state'), true);
  assert.equal(values.has('astrocare:v1:state'), false);
  const saved = changeDemoSession(loaded, { type: 'scenario', scenario: 'stable' }, now);
  assert.equal(saved.scenario, 'stable');
  assert.equal(JSON.parse(values.get(DEMO_SCENARIO_KEY)).scenario, 'stable');
  values.set(DEMO_SCENARIO_KEY, JSON.stringify({ active: true, scenario: 'incomplete' }));
  assert.equal(initializeDemoSession(now).scenario, 'incomplete');
  values.set(DEMO_SCENARIO_KEY, '{ broken JSON');
  values.delete(LEGACY_DEMO_STATE_KEY);
  assert.equal(initializeDemoSession(now).active, false);
});

test('failed demo reset never claims a transition or touches personal records', () => {
  const values = browserStorage();
  const session = initializeDemoSession(now);
  saveCheckin(observation(8));
  const original = values.get('astrocare:v1:state');
  window.localStorage.removeItem = () => { throw new Error('Storage blocked'); };
  assert.throws(() => changeDemoSession(session, { type: 'enter', scenario: 'stable' }, now), /could not be reset/);
  assert.equal(session.active, false);
  assert.equal(values.get('astrocare:v1:state'), original);
  assert.equal(initializeDemoSession(now).active, false);
});

test('clock rebasing preserves intervals, real check-in dates, and original data', () => {
  const input = structuredClone(SCENARIO_DATA.reviewing);
  const actual = observation(8, Date.parse('2029-12-12T10:00:00Z'));
  input.observations.push(actual);
  const original = JSON.stringify(input);
  const rebased = rebaseScenarioData(input, now);
  assert.equal(JSON.stringify(input), original);
  assert.deepEqual(rebased.observations.at(-1), actual);
  const recent = Math.max(...rebased.observations.filter(row => row.provenance === 'synthetic_telemetry').map(row => Date.parse(row.timestamp)));
  assert.equal(now - recent, 3_600_000);
  assert.equal(Date.parse(rebased.observations[1].timestamp) - Date.parse(rebased.observations[0].timestamp), 86_400_000);
  const shift = Date.parse(rebased.observations[0].timestamp) - Date.parse(input.observations[0].timestamp);
  assert.equal(Date.parse(rebased.tasks[0].scheduledFor) - Date.parse(input.tasks[0].scheduledFor), shift);
});

test('all three runtime scenarios remain valid for all six crews on a future clock', () => {
  for (const id of SCENARIO_IDS) {
    const rebased = buildScenarioDataset(id, now);
    assert.equal(rebased.crew.length, 6);
    assert.equal(rebased.tasks.length, 6);
    assert.ok(rebased.observations.every(row => row.provenance === 'synthetic_telemetry'));
    for (const crew of rebased.crew) {
      const results = computeBaselines(rebased.observations, crew.id, new Date(now));
      assert.equal(results.length, 5);
      if (id === 'incomplete') {
        assert.ok(results.some(row => row.status === 'insufficient_data' || row.status === 'stale_data'));
      } else if (id === 'reviewing' && crew.id === crewId) {
        const hrv = results.find(row => row.metric === 'hrv');
        const sleep = results.find(row => row.metric === 'sleep_hours');
        assert.equal(hrv.status, 'worth_reviewing');
        assert.equal(sleep.status, 'worth_reviewing');
        assert.ok(Math.abs(hrv.deltaPct + 16) < 0.1);
        assert.ok(Math.abs(sleep.deltaPct + 20) < 0.1);
      } else if (id === 'stable' || crew.id === 'ac-eng-02') assert.ok(results.every(row => row.status === 'within_range'));
    }
    if (id === 'reviewing') {
      const status = (crew, metric) => computeBaselines(rebased.observations, crew, new Date(now)).find(row => row.metric === metric).status;
      assert.equal(status('ac-sci-03', 'mood'), 'insufficient_data');
      assert.equal(status('ac-med-04', 'hrv'), 'stale_data');
      assert.equal(status('ac-med-04', 'radiation_msv'), 'stale_data');
      assert.equal(status('ac-pay-05', 'exercise_min'), 'worth_reviewing');
      assert.equal(status('ac-plt-06', 'mood'), 'worth_reviewing');
      assert.equal(status('ac-plt-06', 'exercise_min'), 'stale_data');
    }
  }
});
