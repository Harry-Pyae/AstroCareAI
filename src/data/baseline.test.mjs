// Run: node src/data/baseline.test.mjs (Node 22.18+; no extra dependencies).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeBaselines } from '../lib/baseline.ts';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const observations = read('observations.json');
const now = new Date('2026-10-09T06:00:00.000Z');
const before = JSON.stringify(observations);
const results = id => computeBaselines(observations, id, now);
const commander = results('ac-cmdr-01');
for (const [metric, expected] of [['sleep_hours', -20], ['hrv', -16]]) {
  const result = commander.find(row => row.metric === metric);
  assert.equal(result.status, 'worth_reviewing');
  assert.ok(Math.abs(result.deltaPct - expected) < 0.01);
}
const status = (id, metric) => results(id).find(row => row.metric === metric).status;
assert.ok(results('ac-eng-02').every(row => row.status === 'within_range'), 'engineer fully stable');
assert.equal(status('ac-sci-03', 'mood'), 'insufficient_data');
assert.equal(status('ac-med-04', 'hrv'), 'stale_data');
assert.equal(status('ac-med-04', 'radiation_msv'), 'stale_data');
const exercise = results('ac-pay-05').find(row => row.metric === 'exercise_min');
assert.equal(exercise.status, 'worth_reviewing', 'an increase is also only worth reviewing');
assert.ok(Math.abs(exercise.deltaPct - 25) < 0.01);
assert.equal(status('ac-plt-06', 'mood'), 'worth_reviewing');
assert.equal(status('ac-plt-06', 'exercise_min'), 'stale_data');
// Runtime scenarios come from the same profiles.
const { buildObservations, STABLE_PROFILES, INCOMPLETE_PROFILES } = await import('./profiles.ts');
const stable = buildObservations(now.getTime(), STABLE_PROFILES);
assert.ok(read('crew.json').every(m => computeBaselines(stable, m.id, now).every(row => row.status === 'within_range')), 'stable scenario');
const incomplete = buildObservations(now.getTime(), INCOMPLETE_PROFILES);
assert.ok(read('crew.json').every(m => computeBaselines(incomplete, m.id, now).some(row => row.status === 'insufficient_data' || row.status === 'stale_data')), 'incomplete scenario');
assert.ok(incomplete.every(row => row.value > 0), 'gaps are missing readings, never zeros');
assert.equal(JSON.stringify(observations), before, 'Input remains unchanged');
assert.ok(computeBaselines([], 'unknown', now).every(row => row.status === 'insufficient_data'));
const flat = observations.filter(row => row.crewId === 'ac-eng-02').map(row => ({ ...row, value: 0 }));
assert.ok(computeBaselines(flat, 'ac-eng-02', now).every(row => row.status === 'within_range' && row.deltaPct === null));
const nonzero = flat.map(row => ({ ...row, value: Date.parse(row.timestamp) >= now.getTime() - 7 * 86400000 ? 1 : 0 }));
assert.ok(computeBaselines(nonzero, 'ac-eng-02', now).every(row => row.status === 'worth_reviewing' && row.deltaPct === null));
const tasks = read('tasks.json');
assert.equal(read('crew.json').length, 6);
assert.equal(tasks.length, 6);
assert.ok(Date.parse(tasks[0].scheduledFor) > now.getTime() && Date.parse(tasks[0].scheduledFor) <= now.getTime() + 48 * 3600000);
assert.ok(observations.every(row => row.provenance === 'synthetic_telemetry'));
// Exact rolling-window edges, inclusive 48h freshness and 15% threshold.
const day = 86_400_000;
const row = (days, value = 100) => ({ crewId: 'boundary', metric: 'hrv', value, timestamp: new Date(now.getTime() - days * day).toISOString(), provenance: 'synthetic_telemetry' });
const baseline = [28, 24, 20, 16, 8].map(days => row(days));
const hrv = rows => computeBaselines(rows, 'boundary', now).find(result => result.metric === 'hrv');
const boundary = hrv([...baseline, row(28.001, 900), row(7, 115), row(2, 115), row(-1, 900)]);
assert.equal(boundary.baselineMean, 100);
assert.equal(boundary.currentMean, 115);
assert.equal(boundary.deltaPct, 15);
assert.equal(boundary.status, 'worth_reviewing');
assert.equal(hrv([...baseline, row(2, 114.9)]).status, 'within_range');
assert.equal(hrv([...baseline, row(2.001)]).status, 'stale_data');
assert.equal(hrv([...baseline.slice(1), row(0)]).status, 'insufficient_data');
assert.equal(hrv([...baseline, row(0), { ...row(0), value: NaN }, { ...row(0), timestamp: 'invalid' }]).currentMean, 100);
assert.ok(computeBaselines(observations, 'ac-cmdr-01', new Date('invalid')).every(result => result.status === 'insufficient_data'));
console.log('PASS: seed statuses, demo deltas, zero baselines, purity, and task timing');
