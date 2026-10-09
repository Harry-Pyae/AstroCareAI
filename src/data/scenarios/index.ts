import stableData from './stable.json';
import reviewingData from './reviewing.json';
import incompleteData from './incomplete.json';

export type ScenarioId = 'stable' | 'reviewing' | 'incomplete';

export const SCENARIO_DESCRIPTIONS: Record<ScenarioId, string> = {
  stable: 'Stable: All metrics within personal baseline range.',
  reviewing: 'Reviewing: Sleep and HRV drops with upcoming high-attention task.',
  incomplete: 'Incomplete: Missing baseline data and stale readings.'
};

export const SCENARIO_DATA = {
  stable: stableData,
  reviewing: reviewingData,
  incomplete: incompleteData,
};
