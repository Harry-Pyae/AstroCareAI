import { writeFileSync } from 'node:fs';

const now = new Date(); // Use actual current time so they are "now"
const day = 86400000;
const save = (name, value) => writeFileSync(new URL(name, import.meta.url), JSON.stringify(value, null, 2) + '\n');

const crew = [
  { id: 'ac-cmdr-01', name: 'Alex Chen', role: 'Commander' },
  { id: 'ac-eng-02', name: 'Sam Rivera', role: 'Flight Engineer' },
  { id: 'ac-sci-03', name: 'Maya Patel', role: 'Mission Scientist' },
];

const settings = { hrv: 50, sleep_hours: 7.3, exercise_min: 45, radiation_msv: 0.3, mood: 4 };

function generateScenario(id) {
  const observations = [];
  const tasks = [];

  for (const member of crew) {
    for (const [metric, base] of Object.entries(settings)) {
      for (let daysAgo = 34; daysAgo >= 0; daysAgo--) {
        let value = base * (1 + ((daysAgo % 7) - 3) * 0.005);
        
        if (id === 'incomplete') {
          // one metric insufficient (<5 baseline obs): exercise_min
          if (metric === 'exercise_min') {
             // baseline is 28 to 7 days ago.
             // to have <5 baseline obs, we only generate 4 baseline readings
             if (daysAgo >= 7 && daysAgo <= 28) {
               if (daysAgo > 10) continue; // Only keep days 7, 8, 9, 10
             }
          }
          // one stale (>48h old): mood
          if (metric === 'mood') {
             if (daysAgo <= 2) continue; // No readings in the last 48 hours
          }
        }

        if (id === 'reviewing' && member.id === 'ac-cmdr-01' && daysAgo < 7) {
          if (metric === 'sleep_hours') value = base * (0.8 + (daysAgo - 3) * 0.02);
          if (metric === 'hrv') value = base * (0.84 + (daysAgo - 3) * 0.015);
        }

        observations.push({ 
          crewId: member.id, 
          metric, 
          value: Number(value.toFixed(4)), 
          timestamp: new Date(now.getTime() - daysAgo * day - 3600000).toISOString(), 
          provenance: 'synthetic_telemetry' 
        });
      }
    }
  }

  // Tasks
  if (id === 'reviewing') {
    tasks.push({ 
      crewId: crew[0].id, 
      title: 'Docking approach monitoring', 
      scheduledFor: new Date(now.getTime() + day).toISOString(), 
      attentionDemands: ['sustained attention', 'fine motor control'] 
    });
  } else {
    tasks.push({ 
      crewId: crew[0].id, 
      title: 'Routine maintenance', 
      scheduledFor: new Date(now.getTime() + day * 2).toISOString(), 
      attentionDemands: ['procedural attention'] 
    });
  }

  return { crew, observations, tasks };
}

save('stable.json', generateScenario('stable'));
save('reviewing.json', generateScenario('reviewing'));
save('incomplete.json', generateScenario('incomplete'));
