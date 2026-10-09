// Real P2/P4 module integration: node src/components/brief/integration.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeBaselines } from '../../lib/baseline.ts';
import { getCheckins, getDecisions, saveCheckinEntry, saveDecision } from '../../lib/storage.ts';

const entries = new Map();
globalThis.window = { localStorage: {
  getItem: key => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, value),
} };
const crewId = 'ac-cmdr-01';
const now = new Date('2026-10-09T06:00:00.000Z');
const observations = JSON.parse(readFileSync(new URL('../../data/observations.json', import.meta.url), 'utf8'));
const findSleep = rows => computeBaselines(rows, crewId, now).find(row => row.metric === 'sleep_hours');
const before = findSleep(observations);
const checkin = { crewId, metric: 'sleep_hours', value: 8, timestamp: now.toISOString(), provenance: 'user_checkin' };
assert.equal(saveCheckinEntry(checkin, { crewId, timestamp: checkin.timestamp, fatigue: 2, note: 'Synthetic integration check' }), true);
assert.deepEqual(getCheckins(crewId), [checkin]);
assert.ok(findSleep([...observations, ...getCheckins(crewId)]).currentMean > before.currentMean);
for (const [index, action] of ['recheck', 'request_review', 'propose_schedule_change'].entries()) {
  assert.equal(saveDecision({ crewId, action, note: action, timestamp: new Date(now.getTime() + index * 1000).toISOString() }), true);
}
assert.deepEqual(getDecisions(crewId).map(row => row.action), ['propose_schedule_change', 'request_review', 'recheck']);
assert.deepEqual(getDecisions('ac-eng-02'), []);
window.localStorage.setItem = () => { throw new Error('Storage unavailable'); };
assert.equal(saveDecision({ crewId, action: 'recheck', note: '', timestamp: now.toISOString() }), false);
assert.equal(getDecisions(crewId).length, 3);
console.log('PASS: real storage check-in updates baseline, all decision actions persist, history sorts and isolates crew, failed writes return false.');
