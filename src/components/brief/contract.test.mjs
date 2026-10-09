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
// The weather client imports only this shared transport type contract.
// Include it in the isolated shell without copying server runtime or secrets.
mkdirSync(join(work, 'server'), { recursive: true });
cpSync(join(root, 'server/space-weather-types.ts'), join(work, 'server/space-weather-types.ts'));
for (const file of ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html']) cpSync(join(root, file), join(work, file));
symlinkSync(join(root, 'node_modules'), join(work, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
mkdirSync(join(work, 'src/lib'), { recursive: true });
mkdirSync(join(work, 'src/data'), { recursive: true });
const save = (name, value) => writeFileSync(join(work, 'src', name), value);
// Theme controls exist only in this temporary preview, never in P1's shell.
save('main.tsx', `import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
function Preview() { const [theme, setTheme] = useState('dark'); return <div data-theme={theme}><div style={{padding:12,background:'Canvas',color:'CanvasText'}}><button onClick={() => setTheme('dark')}>Preview dark theme</button> · <button onClick={() => setTheme('light')}>Preview light theme</button></div><App /></div>; }
ReactDOM.createRoot(document.getElementById('root')!).render(<Preview />);`);
// Verbatim field contracts, with exports for module imports.
save('lib/types.ts', `
export interface CrewMember { id: string; name: string; role: string; }
export interface Observation { crewId: string; metric: "hrv"|"sleep_hours"|"exercise_min"|"radiation_msv"|"mood"; value: number; timestamp: string; provenance: "synthetic_telemetry"|"user_checkin"; }
export interface BaselineResult { metric: string; baselineMean: number; baselineWindowDays: number; currentMean: number; currentWindowDays: number; deltaPct: number|null; status: "within_range"|"worth_reviewing"|"insufficient_data"|"stale_data"; explanation: string; }
export interface Decision { crewId: string; action: "recheck"|"request_review"|"propose_schedule_change"; note: string; timestamp: string; }
export interface TaskContext { crewId: string; title: string; scheduledFor: string; attentionDemands: string[]; }
`);
// Keep real storage signatures, including DemoProvider namespace support.
// Effects do not run during server rendering, so this fixture never persists data.
save('lib/baseline.ts', `import type { Observation, BaselineResult } from './types';
export function computeBaselines(observations: Observation[], crewId: string, now: Date): BaselineResult[] {
 return [
 {metric:'hrv',status:'worth_reviewing',baselineMean:50,currentMean:42,deltaPct:-16},
 {metric:'sleep_hours',status:'within_range',baselineMean:7.3,currentMean:7.3,deltaPct:0},
 {metric:'exercise_min',status:'insufficient_data',baselineMean:0,currentMean:0,deltaPct:null},
 {metric:'radiation_msv',status:'stale_data',baselineMean:0.3,currentMean:0.3,deltaPct:0},
 {metric:'mood',status:'within_range',baselineMean:4,currentMean:4,deltaPct:0},
 ].map(row => ({...row,status:crewId==='ac-eng-02'?'within_range':row.status,baselineWindowDays:21,currentWindowDays:7,explanation:row.status==='worth_reviewing'?'Average HRV is 16% below this crew member’s baseline. Change worth reviewing.':'Personal observations compared with baseline.'})) as BaselineResult[];
}`);
save('data/crew.json', JSON.stringify([{ id: 'ac-cmdr-01', name: 'Demo Commander', role: 'Commander' }, { id:'ac-eng-02', name:'Demo Engineer', role:'Engineer' }]));
save('data/observations.json', JSON.stringify(['hrv', 'sleep_hours', 'exercise_min', 'radiation_msv', 'mood'].flatMap(metric => Array.from({ length: metric === 'exercise_min' ? 2 : 35 }, (_, daysAgo) => ({ crewId: 'ac-cmdr-01', metric, value: metric === 'hrv' ? (daysAgo < 7 ? 42 + (daysAgo - 3) : 50) : ({ sleep_hours: 7.3, exercise_min: 45, radiation_msv: 0.3, mood: 4 })[metric], timestamp: new Date(Date.now() - daysAgo * 86_400_000 - 3_600_000).toISOString(), provenance: 'synthetic_telemetry' }))).filter(row => row.metric !== 'radiation_msv' || Date.parse(row.timestamp) < Date.now() - 3 * 86_400_000)));
save('data/tasks.json', JSON.stringify([{ crewId: 'ac-cmdr-01', title: 'Docking approach monitoring', scheduledFor: new Date(Date.now() + 86_400_000).toISOString(), attentionDemands: ['sustained attention', 'fine motor control'] }]));
const run = (file, args) => execFileSync(process.execPath, [join(root, 'node_modules', file), ...args], { cwd: work, stdio: 'pipe' }).toString();
try {
  run('typescript/bin/tsc', ['--noEmit']);
  run('vite/bin/vite.js', ['build']);
  save('verify.tsx', "export { default as BriefScreen } from './screens/BriefScreen'; export { LanguageProvider } from './i18n/LanguageProvider'; export { DemoProvider } from './components/demo/DemoProvider'; export { default as DecisionBar } from './components/brief/DecisionBar'; export { default as SelfReportCard } from './components/brief/SelfReportCard';");
  run('vite/bin/vite.js', ['build', '--ssr', 'src/verify.tsx', '--outDir', 'ssr']);
  const { BriefScreen, LanguageProvider, DemoProvider, DecisionBar, SelfReportCard } = await import(pathToFileURL(join(work, 'ssr/verify.js')).href);
  const render = path => renderToString(React.createElement(LanguageProvider, null, React.createElement(DemoProvider, null, React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Routes, null, React.createElement(Route, { path: '/crew/:crewId', element: React.createElement(BriefScreen) }))))));
  const page = render('/crew/ac-cmdr-01');
  for (const text of ["Today&#x27;s overview", 'Demo Commander', 'Latest observation', 'Start check-in', 'Changes to review', 'Worth reviewing', 'Within range', 'Insufficient data', 'Stale data', 'Not enough baseline observations', 'Last reading 3 days ago', 'Shaded: personal baseline', 'Docking approach monitoring', 'sustained attention', 'fine motor control', 'Recheck', 'Request review', 'Propose schedule change', 'No decisions recorded yet', 'Self-reported today']) assert.ok(page.includes(text), `Missing ${text}`);
  assert.ok(page.indexOf('Changes to review') < page.indexOf('Baseline vs recent trend'), 'Review comes before chart');
  assert.ok((page.match(/class="brief-support-card\b/g) ?? []).length <= 4);
  assert.ok(page.includes('aria-haspopup="listbox"'), 'Metric uses shared accessible Select');
  assert.equal(page.includes('<select'), false, 'No native metric selector');
  const clear = render('/crew/ac-eng-02');
  assert.ok(clear.includes('No changes flagged against personal baseline'));
  assert.ok(clear.includes('This is not medical clearance'));
  assert.ok(render('/crew/unknown').includes('Crew member not found'));
  const decisionRows = [
    { crewId: 'ac-cmdr-01', action: 'recheck', note: 'Earlier note', timestamp: '2026-10-09T04:00:00Z' },
    { crewId: 'ac-cmdr-01', action: 'request_review', note: 'Latest note', timestamp: '2026-10-09T05:00:00Z' },
  ];
  const history = renderToString(React.createElement(LanguageProvider, null, React.createElement(DecisionBar, { decisions: decisionRows, onSave: () => {} })));
  for (const column of ['Action', 'Note', 'Recorded']) assert.ok(history.includes('role="columnheader"') && history.includes(column));
  assert.ok(history.indexOf('Latest note') < history.indexOf('Earlier note'), 'History newest first');
  assert.match(history, /datetime="2026-10-09T05:00:00Z"/i, 'Recorded timestamp retained');
  assert.equal(decisionRows[0].note, 'Earlier note', 'Rendering does not mutate history');
  const reportNow = new Date('2026-10-09T12:00:00Z');
  const reportTime = '2026-10-09T11:00:00Z';
  const reportDetails = [
    { crewId: 'ac-eng-02', timestamp: '2026-10-09T11:30:00Z', fatigue: 1, note: 'Other crew note' },
    { crewId: 'ac-cmdr-01', timestamp: '2026-10-09T13:00:00Z', fatigue: 1, note: 'Future note' },
    { crewId: 'ac-cmdr-01', timestamp: 'invalid', fatigue: 1, note: 'Invalid note' },
    { crewId: 'ac-cmdr-01', timestamp: reportTime, fatigue: 2, note: 'Recorded note', sleepQuality: 4, stress: 3, hydrationLiters: 0, symptoms: ['none'] },
  ];
  const reportObservations = [
    { crewId: 'ac-eng-02', timestamp: reportTime, metric: 'sleep_hours', value: 22, provenance: 'user_checkin' },
    { crewId: 'ac-cmdr-01', timestamp: reportTime, metric: 'sleep_hours', value: 7.5, provenance: 'user_checkin' },
    { crewId: 'ac-cmdr-01', timestamp: reportTime, metric: 'exercise_min', value: 0, provenance: 'user_checkin' },
    { crewId: 'ac-cmdr-01', timestamp: reportTime, metric: 'mood', value: 4, provenance: 'user_checkin' },
  ];
  const renderReport = (details, checkins = reportObservations) => renderToString(React.createElement(LanguageProvider, null,
    React.createElement(MemoryRouter, null, React.createElement(SelfReportCard, { details, checkins, now: reportNow, crewId: 'ac-cmdr-01' }))));
  const report = renderReport(reportDetails);
  for (const text of ['7.5 h', '0 min', '0 L', 'Recorded note', 'contribute to recent averages', 'without comparison or interpretation']) assert.ok(report.includes(text), `Missing descriptive report ${text}`);
  for (const excluded of ['Other crew note', 'Future note', 'Invalid note', '22 h', 'Worth reviewing']) assert.equal(report.includes(excluded), false, `Unexpected self-report ${excluded}`);
  assert.equal(reportDetails[0].crewId, 'ac-eng-02', 'Self report does not mutate detail order');
  const oldReport = renderReport([{ crewId: 'ac-cmdr-01', timestamp: '2026-10-07T11:00:00Z', fatigue: 3, note: '' }]);
  assert.ok(oldReport.includes('This check-in is more than a day old.'));
  const emptyReport = renderReport(reportDetails.filter(row => row.note !== 'Recorded note'));
  assert.ok(emptyReport.includes('No check-in recorded yet.'));
  assert.ok(emptyReport.includes('/crew/ac-cmdr-01/checkin'), 'Missing self report offers check-in action');
  assert.ok(existsSync(join(work, 'dist/index.html')));
  assert.ok(readFileSync(join(root, 'src/screens/BriefScreen.tsx'), 'utf8').includes('saveDecision(decision)'));
  console.log('PASS: contract typecheck/build, crew routes, baseline states/chart/task, shared select, sorted decision columns/dateTime, and descriptive self-report isolation/freshness/empty states.');
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
