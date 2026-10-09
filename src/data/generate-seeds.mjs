// Reproducible illustrative demo settings. All observations are synthetic.
import { writeFileSync } from 'node:fs';
const now = new Date('2026-10-09T06:00:00.000Z');
const day = 86400000;
const save = (name, value) => writeFileSync(new URL(name, import.meta.url), JSON.stringify(value, null, 2) + '\n');
const crew = [
  { id: 'ac-cmdr-01', name: 'Alex Chen', role: 'Commander' },
  { id: 'ac-eng-02', name: 'Sam Rivera', role: 'Flight Engineer' },
  { id: 'ac-sci-03', name: 'Maya Patel', role: 'Mission Scientist' },
];
const settings = { hrv: 50, sleep_hours: 7.3, exercise_min: 45, radiation_msv: 0.3, mood: 4 };
const observations = [];
for (const member of crew) {
  for (const [metric, base] of Object.entries(settings)) {
    for (let daysAgo = 34; daysAgo >= 0; daysAgo--) {
      // Scientist: only three baseline mood readings; radiation ends 3 days ago.
      if (member.id === 'ac-sci-03' && metric === 'mood' && daysAgo >= 7 && ![10, 17, 24].includes(daysAgo)) continue;
      if (member.id === 'ac-sci-03' && metric === 'radiation_msv' && daysAgo < 3) continue;
      let value = base * (1 + ((daysAgo % 7) - 3) * 0.005);
      if (member.id === 'ac-cmdr-01' && daysAgo < 7) {
        // A descending recent week, averaging -20% sleep and -16% HRV.
        if (metric === 'sleep_hours') value = base * (0.8 + (daysAgo - 3) * 0.02);
        if (metric === 'hrv') value = base * (0.84 + (daysAgo - 3) * 0.015);
      }
      observations.push({ crewId: member.id, metric, value: Number(value.toFixed(4)), timestamp: new Date(now.getTime() - daysAgo * day - 3600000).toISOString(), provenance: 'synthetic_telemetry' });
    }
  }
}
save('crew.json', crew);
save('observations.json', observations);
save('tasks.json', [
  { crewId: crew[0].id, title: 'Docking approach monitoring', scheduledFor: new Date(now.getTime() + day).toISOString(), attentionDemands: ['sustained attention', 'fine motor control'] },
  { crewId: crew[1].id, title: 'Life support maintenance', scheduledFor: new Date(now.getTime() + 30 * 3600000).toISOString(), attentionDemands: ['procedural attention', 'equipment handling'] },
  { crewId: crew[2].id, title: 'Orbital sample imaging', scheduledFor: new Date(now.getTime() + 36 * 3600000).toISOString(), attentionDemands: ['visual observation', 'data recording'] },
]);
// Fictional events in the DONKI FLR response shape; not live NASA records.
save('spaceweather-fallback.json', [
  { flrID: '2026-10-05T08:12:00-FLR-001', beginTime: '2026-10-05T08:12Z', peakTime: '2026-10-05T08:28Z', classType: 'C2.4' },
  { flrID: '2026-10-06T14:05:00-FLR-001', beginTime: '2026-10-06T14:05Z', peakTime: '2026-10-06T14:21Z', classType: 'M1.2' },
  { flrID: '2026-10-07T03:40:00-FLR-001', beginTime: '2026-10-07T03:40Z', peakTime: '2026-10-07T03:54Z', classType: 'C5.1' },
  { flrID: '2026-10-08T19:10:00-FLR-001', beginTime: '2026-10-08T19:10Z', peakTime: '2026-10-08T19:33Z', classType: 'M2.0' },
  { flrID: '2026-10-09T01:15:00-FLR-001', beginTime: '2026-10-09T01:15Z', peakTime: '2026-10-09T01:26Z', classType: 'C3.7' },
]);
