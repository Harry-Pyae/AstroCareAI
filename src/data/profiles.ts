// Single source for all synthetic demo data (illustrative demo settings, not
// clinical values). Used at runtime for scenarios and by generate-seeds.mjs
// for the reproducible JSON fixtures.
import type { CrewMember, Observation, TaskContext } from '../lib/types';

type Metric = Observation['metric'];
export interface Profile {
  /** Recent-week change vs baseline, e.g. -0.2 = 20% below. */
  change?: Partial<Record<Metric, number>>;
  /** Only 3 baseline readings (needs 5): insufficient_data. */
  insufficient?: Metric[];
  /** No readings in the last 3 days: stale_data. */
  stale?: Metric[];
}

const DAY = 86_400_000;
const HOUR = 3_600_000;

export const CREW: (CrewMember & { base: Record<Metric, number> })[] = [
  { id: 'ac-cmdr-01', name: 'Alex Chen', role: 'Commander', base: { hrv: 50, sleep_hours: 7.3, exercise_min: 45, radiation_msv: 0.3, mood: 4 } },
  { id: 'ac-eng-02', name: 'Sam Rivera', role: 'Flight Engineer', base: { hrv: 62, sleep_hours: 7, exercise_min: 50, radiation_msv: 0.28, mood: 4 } },
  { id: 'ac-sci-03', name: 'Maya Patel', role: 'Mission Specialist', base: { hrv: 55, sleep_hours: 7.5, exercise_min: 40, radiation_msv: 0.31, mood: 4 } },
  { id: 'ac-med-04', name: 'Lena Okafor', role: 'Medical Officer', base: { hrv: 48, sleep_hours: 7.2, exercise_min: 35, radiation_msv: 0.29, mood: 4 } },
  { id: 'ac-pay-05', name: 'Kenji Sato', role: 'Payload Specialist', base: { hrv: 58, sleep_hours: 6.9, exercise_min: 45, radiation_msv: 0.32, mood: 4 } },
  { id: 'ac-plt-06', name: 'Sofia Marquez', role: 'Pilot', base: { hrv: 52, sleep_hours: 7.4, exercise_min: 55, radiation_msv: 0.3, mood: 4 } },
];

/** Default seeds: one profile per demo story. */
export const DEFAULT_PROFILES: Record<string, Profile> = {
  'ac-cmdr-01': { change: { sleep_hours: -0.2, hrv: -0.16 } }, // the demo star
  'ac-eng-02': {}, // fully stable
  'ac-sci-03': { insufficient: ['mood'] },
  'ac-med-04': { stale: ['hrv', 'radiation_msv'] },
  'ac-pay-05': { change: { exercise_min: 0.25 } }, // an increase is still only "worth reviewing"
  'ac-plt-06': { change: { mood: -0.18 }, stale: ['exercise_min'] }, // mixed
};
export const STABLE_PROFILES: Record<string, Profile> = Object.fromEntries(CREW.map(m => [m.id, {}]));
export const INCOMPLETE_PROFILES: Record<string, Profile> = {
  'ac-cmdr-01': { insufficient: ['sleep_hours'], stale: ['hrv'] },
  'ac-eng-02': { insufficient: ['mood'] },
  'ac-sci-03': { stale: ['radiation_msv'] },
  'ac-med-04': { insufficient: ['exercise_min'], stale: ['hrv'] },
  'ac-pay-05': { stale: ['sleep_hours'] },
  'ac-plt-06': { insufficient: ['mood'], stale: ['radiation_msv'] },
};

/** 35 daily readings per metric, newest one hour before `now`. The baseline
 * window holds exactly 3 weeks, so its mean equals the profile base. */
export function buildObservations(now: number, profiles: Record<string, Profile>): Observation[] {
  const rows: Observation[] = [];
  for (const member of CREW) {
    const profile = profiles[member.id] ?? {};
    for (const [metric, base] of Object.entries(member.base) as [Metric, number][]) {
      for (let daysAgo = 34; daysAgo >= 0; daysAgo--) {
        if (profile.insufficient?.includes(metric) && daysAgo >= 7 && ![10, 17, 24].includes(daysAgo)) continue;
        if (profile.stale?.includes(metric) && daysAgo < 3) continue;
        const change = profile.change?.[metric];
        // Recent week trends toward the change; its mean is exactly base * (1 + change).
        const value = change !== undefined && daysAgo < 7
          ? base * (1 + change - (daysAgo - 3) * change / 10)
          : base * (1 + ((daysAgo % 7) - 3) * 0.005);
        rows.push({ crewId: member.id, metric, value: Number(value.toFixed(4)), timestamp: new Date(now - daysAgo * DAY - HOUR).toISOString(), provenance: 'synthetic_telemetry' });
      }
    }
  }
  return rows;
}

const TASKS: [string, number, string, string[]][] = [
  ['ac-cmdr-01', 24, 'Docking approach monitoring', ['sustained attention', 'fine motor control']],
  ['ac-eng-02', 30, 'Life support maintenance', ['procedural attention', 'equipment handling']],
  ['ac-sci-03', 36, 'Orbital sample imaging', ['visual observation', 'data recording']],
  ['ac-med-04', 20, 'Crew medical kit inventory', ['procedural attention', 'data recording']],
  ['ac-pay-05', 12, 'Payload deployment rehearsal', ['fine motor control', 'team coordination']],
  ['ac-plt-06', 40, 'Manual piloting simulator session', ['sustained attention', 'rapid decision-making']],
];

export function buildTasks(now: number): TaskContext[] {
  return TASKS.map(([crewId, hours, title, attentionDemands]) => ({ crewId, title, scheduledFor: new Date(now + hours * HOUR).toISOString(), attentionDemands }));
}

export const crewList = (): CrewMember[] => CREW.map(({ id, name, role }) => ({ id, name, role }));
