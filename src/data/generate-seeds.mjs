// Writes the reproducible JSON fixtures (fixed reference time) from the same
// profiles the app uses. Run: node src/data/generate-seeds.mjs (Node 22.18+).
import { writeFileSync } from 'node:fs';
import { DEFAULT_PROFILES, buildObservations, buildTasks, crewList } from './profiles.ts';

const now = Date.parse('2026-10-09T06:00:00.000Z');
const save = (name, value) => writeFileSync(new URL(name, import.meta.url), JSON.stringify(value, null, 2) + '\n');
save('crew.json', crewList());
save('observations.json', buildObservations(now, DEFAULT_PROFILES));
save('tasks.json', buildTasks(now));
// Fictional events in the DONKI FLR response shape; not live NASA records.
save('spaceweather-fallback.json', [
  { flrID: '2026-10-05T08:12:00-FLR-001', beginTime: '2026-10-05T08:12Z', peakTime: '2026-10-05T08:28Z', classType: 'C2.4' },
  { flrID: '2026-10-06T14:05:00-FLR-001', beginTime: '2026-10-06T14:05Z', peakTime: '2026-10-06T14:21Z', classType: 'M1.2' },
  { flrID: '2026-10-07T03:40:00-FLR-001', beginTime: '2026-10-07T03:40Z', peakTime: '2026-10-07T03:54Z', classType: 'C5.1' },
  { flrID: '2026-10-08T19:10:00-FLR-001', beginTime: '2026-10-08T19:10Z', peakTime: '2026-10-08T19:33Z', classType: 'M2.0' },
  { flrID: '2026-10-09T01:15:00-FLR-001', beginTime: '2026-10-09T01:15Z', peakTime: '2026-10-09T01:26Z', classType: 'C3.7' },
]);
