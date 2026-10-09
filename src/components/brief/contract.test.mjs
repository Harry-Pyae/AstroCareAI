// node src/components/brief/contract.test.mjs
// Tests P3 in an isolated temporary integration shell. Fixtures implement the
// published contracts, not P2/P4 branches. No other owner's files are changed.
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const work = mkdtempSync(join(tmpdir(), 'astrocare-p3-'));
cpSync(join(root, 'src'), join(work, 'src'), { recursive: true });
for (const file of ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html']) cpSync(join(root, file), join(work, file));
symlinkSync(join(root, 'node_modules'), join(work, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
mkdirSync(join(work, 'src/lib'), { recursive: true });
mkdirSync(join(work, 'src/data'), { recursive: true });
const save = (name, value) => writeFileSync(join(work, 'src', name), value);
// Verbatim field contracts, with exports for module imports.
save('lib/types.ts', `
export interface CrewMember { id: string; name: string; role: string; }
export interface Observation { crewId: string; metric: "hrv"|"sleep_hours"|"exercise_min"|"radiation_msv"|"mood"; value: number; timestamp: string; provenance: "synthetic_telemetry"|"user_checkin"; }
export interface BaselineResult { metric: string; baselineMean: number; baselineWindowDays: number; currentMean: number; currentWindowDays: number; deltaPct: number|null; status: "within_range"|"worth_reviewing"|"insufficient_data"|"stale_data"; explanation: string; }
export interface Decision { crewId: string; action: "recheck"|"request_review"|"propose_schedule_change"; note: string; timestamp: string; }
export interface TaskContext { crewId: string; title: string; scheduledFor: string; attentionDemands: string[]; }
`);
save('lib/storage.ts', `import type { Decision, Observation } from './types';
export function getDecisions(crewId: string): Decision[] { return typeof localStorage === 'undefined' ? [] : JSON.parse(localStorage.getItem('p3-test-decisions') ?? '[]').filter((item: Decision) => item.crewId === crewId); }
export function getCheckins(crewId: string): Observation[] { return []; }
export function saveDecision(decision: Decision): boolean { const rows = JSON.parse(localStorage.getItem('p3-test-decisions') ?? '[]'); localStorage.setItem('p3-test-decisions', JSON.stringify([...rows, decision])); return true; }
export function saveCheckinEntry(observation: Observation, details: { crewId: string; timestamp: string; fatigue: number; note: string }): boolean { return true; }
`);
save('lib/baseline.ts', `import type { Observation, BaselineResult } from './types';
export function computeBaselines(observations: Observation[], crewId: string, now: Date): BaselineResult[] {
 return [
 {metric:'hrv',status:'worth_reviewing',baselineMean:50,currentMean:42,deltaPct:-16},
 {metric:'sleep_hours',status:'within_range',baselineMean:7.3,currentMean:7.3,deltaPct:0},
 {metric:'exercise_min',status:'insufficient_data',baselineMean:0,currentMean:0,deltaPct:null},
 {metric:'radiation_msv',status:'stale_data',baselineMean:0.3,currentMean:0.3,deltaPct:0},
 {metric:'mood',status:'within_range',baselineMean:4,currentMean:4,deltaPct:0},
 ].map(row => ({...row,baselineWindowDays:21,currentWindowDays:7,explanation:'Average HRV is 16% below this crew member’s baseline. Change worth reviewing.'})) as BaselineResult[];
}`);
save('data/crew.json', JSON.stringify([{ id: 'ac-cmdr-01', name: 'Demo Commander', role: 'Commander' }]));
save('data/observations.json', JSON.stringify(['hrv', 'sleep_hours', 'exercise_min', 'radiation_msv', 'mood'].flatMap(metric => Array.from({ length: metric === 'exercise_min' ? 2 : 35 }, (_, daysAgo) => ({ crewId: 'ac-cmdr-01', metric, value: metric === 'hrv' ? (daysAgo < 7 ? 42 + (daysAgo - 3) : 50) : ({ sleep_hours: 7.3, exercise_min: 45, radiation_msv: 0.3, mood: 4 })[metric], timestamp: new Date(Date.now() - daysAgo * 86_400_000 - 3_600_000).toISOString(), provenance: 'synthetic_telemetry' }))).filter(row => row.metric !== 'radiation_msv' || Date.parse(row.timestamp) < Date.now() - 3 * 86_400_000)));
save('data/tasks.json', JSON.stringify([{ crewId: 'ac-cmdr-01', title: 'Docking approach monitoring', scheduledFor: new Date(Date.now() + 86_400_000).toISOString(), attentionDemands: ['sustained attention', 'fine motor control'] }]));
const run = (file, args) => execFileSync(process.execPath, [join(root, 'node_modules', file), ...args], { cwd: work, stdio: 'pipe' }).toString();
try {
  run('typescript/bin/tsc', ['--noEmit']);
  run('vite/bin/vite.js', ['build']);
  run('vite/bin/vite.js', ['build', '--ssr', 'src/screens/BriefScreen.tsx', '--outDir', 'ssr']);
  const { default: BriefScreen } = await import(pathToFileURL(join(work, 'ssr/BriefScreen.js')).href);
  const render = path => renderToString(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Routes, null, React.createElement(Route, { path: '/crew/:crewId', element: React.createElement(BriefScreen) }))));
  const page = render('/crew/ac-cmdr-01');
  for (const text of ['Demo Commander', 'Commander', 'No check-in recorded yet', 'Worth reviewing', 'Within range', 'Insufficient data', 'Stale data', 'Not enough baseline observations', '48 hours', 'Shaded: personal baseline', 'Docking approach monitoring', 'sustained attention', 'fine motor control', 'Recheck', 'Request review', 'Propose schedule change', 'No decisions recorded yet']) assert.ok(page.includes(text), `Missing ${text}`);
  assert.ok(page.includes('aria-expanded="true"'), 'Review details initially expanded');
  assert.ok(render('/crew/unknown').includes('Crew member not found'));
  assert.ok(existsSync(join(work, 'dist/index.html')));
  assert.ok(readFileSync(join(root, 'src/screens/BriefScreen.tsx'), 'utf8').includes('saveDecision(decision)'));
  console.log('PASS: contract typecheck, production build, crew route, all status states, chart reference legend, task context, decision controls, and unknown crew.');
  console.log(`Temporary integration artifacts: ${work}`);
  if (process.argv.includes('--serve')) {
    const server = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: work, stdio: 'inherit' });
    await new Promise(done => server.on('exit', done));
  }
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
}
