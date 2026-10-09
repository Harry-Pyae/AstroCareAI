import stableData from './stable.json' with { type: 'json' };
import reviewingData from './reviewing.json' with { type: 'json' };
import incompleteData from './incomplete.json' with { type: 'json' };
import type { CrewMember, Observation, TaskContext } from '../../lib/types';

export type ScenarioId = 'stable' | 'reviewing' | 'incomplete';

export interface ScenarioData {
  crew: CrewMember[];
  observations: Observation[];
  tasks: TaskContext[];
}

export interface Scenario extends ScenarioData {
  id: ScenarioId;
  name: string;
  description: string;
}

export const SCENARIO_DESCRIPTIONS: Record<ScenarioId, string> = {
  stable: 'Stable: All metrics within personal baseline range.',
  reviewing: 'Reviewing: Sleep and HRV drops with upcoming high-attention task.',
  incomplete: 'Incomplete: Missing baseline data and stale readings.',
};

// Full seeded sets are compared by computeBaselines, never precomputed mocks.
export const SCENARIO_DATA: Record<ScenarioId, ScenarioData> = {
  stable: stableData as ScenarioData,
  reviewing: reviewingData as ScenarioData,
  incomplete: incompleteData as ScenarioData,
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  stable: { id: 'stable', name: 'Stable observations', description: SCENARIO_DESCRIPTIONS.stable, ...SCENARIO_DATA.stable },
  reviewing: { id: 'reviewing', name: 'Change worth reviewing', description: SCENARIO_DESCRIPTIONS.reviewing, ...SCENARIO_DATA.reviewing },
  incomplete: { id: 'incomplete', name: 'Incomplete information', description: SCENARIO_DESCRIPTIONS.incomplete, ...SCENARIO_DATA.incomplete },
};
