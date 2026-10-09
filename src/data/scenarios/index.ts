import type { Observation, BaselineResult, TaskContext } from '../../screens/BriefScreen';

export type ScenarioId = 'stable' | 'review' | 'incomplete';

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  baselines: BaselineResult[];
  observations: Observation[];
  task: TaskContext | null;
}

// Deterministic seeded datasets
const nowTime = Date.now();
const DAY = 24 * 60 * 60 * 1000;

function generateObservations(baseHrv: number, baseSleep: number, dropHrv: boolean, dropSleep: boolean): Observation[] {
  const obs: Observation[] = [];
  // Use a pseudo-random seed to make it deterministic
  const random = (seed: number) => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 35; i >= 0; i--) {
    const ts = new Date(nowTime - i * DAY).toISOString();
    // Deterministic random
    const randVal1 = random(i * 13);
    const randVal2 = random(i * 17);
    
    // HRV
    let hrvVal = baseHrv + randVal1 * 4;
    if (dropHrv && i <= 7) hrvVal -= 10;
    obs.push({ crewId: 'ac-cmdr-01', metric: 'hrv', timestamp: ts, provenance: 'synthetic_telemetry', value: hrvVal });
    
    // Sleep
    let sleepVal = baseSleep + randVal2 * 1;
    if (dropSleep && i <= 7) sleepVal -= 1.5;
    obs.push({ crewId: 'ac-cmdr-01', metric: 'sleep_hours', timestamp: ts, provenance: 'synthetic_telemetry', value: sleepVal });
  }
  return obs;
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  stable: {
    id: 'stable',
    name: 'Stable observations',
    description: 'Recent values close to baseline; neutral wording.',
    baselines: [
      {
        metric: "sleep_hours",
        baselineMean: 7.2,
        baselineWindowDays: 20,
        currentMean: 7.1,
        currentWindowDays: 7,
        deltaPct: -1.4,
        status: "within_range",
        explanation: "Recent average is consistent with the personal 28-day baseline."
      },
      {
        metric: "hrv",
        baselineMean: 62,
        baselineWindowDays: 20,
        currentMean: 61,
        currentWindowDays: 7,
        deltaPct: -1.6,
        status: "within_range",
        explanation: "Heart rate variability is stable compared to historical baseline."
      }
    ],
    observations: generateObservations(60, 7, false, false),
    task: {
      crewId: 'ac-cmdr-01',
      title: "Routine maintenance",
      scheduledFor: new Date(nowTime + 24 * 60 * 60 * 1000).toISOString(),
      attentionDemands: ["General awareness"]
    }
  },
  review: {
    id: 'review',
    name: 'Change worth reviewing',
    description: 'Sleep + fatigue drift from baseline; high-attention task upcoming.',
    baselines: [
      {
        metric: "sleep_hours",
        baselineMean: 7.3,
        baselineWindowDays: 20,
        currentMean: 5.8,
        currentWindowDays: 7,
        deltaPct: -20.5,
        status: "worth_reviewing",
        explanation: "Recent average is significantly below the personal 28-day baseline."
      },
      {
        metric: "hrv",
        baselineMean: 62,
        baselineWindowDays: 20,
        currentMean: 52,
        currentWindowDays: 7,
        deltaPct: -16.1,
        status: "worth_reviewing",
        explanation: "Heart rate variability has dropped compared to historical baseline."
      }
    ],
    observations: generateObservations(60, 7, true, true),
    task: {
      crewId: 'ac-cmdr-01',
      title: "Docking approach monitoring",
      scheduledFor: new Date(nowTime + 48 * 60 * 60 * 1000).toISOString(),
      attentionDemands: ["Sustained attention", "Fine motor control"]
    }
  },
  incomplete: {
    id: 'incomplete',
    name: 'Incomplete information',
    description: 'Missing + stale metrics; limited interpretation.',
    baselines: [
      {
        metric: "exercise_min",
        baselineMean: null,
        baselineWindowDays: 20,
        currentMean: 45,
        currentWindowDays: 7,
        deltaPct: null,
        status: "insufficient_data",
        explanation: "Not enough historical observations to establish a reliable baseline."
      },
      {
        metric: "mood",
        baselineMean: 4.2,
        baselineWindowDays: 20,
        currentMean: null,
        currentWindowDays: 7,
        deltaPct: null,
        status: "stale_data",
        explanation: "Latest self-reported mood observation is older than 48 hours."
      }
    ],
    observations: [], // missing/stale data
    task: null
  }
};
