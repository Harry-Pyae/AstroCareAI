import stableData from './stable.json';
import reviewingData from './reviewing.json';
import incompleteData from './incomplete.json';
import { rebase, type Dataset } from '../dataset';

export type ScenarioId = 'stable' | 'reviewing' | 'incomplete';
export const SCENARIO_IDS: ScenarioId[] = ['stable', 'reviewing', 'incomplete'];

// label/description are i18n keys.
export const SCENARIOS: Record<ScenarioId, { label: string; description: string; dataset: Dataset }> = {
  stable: { label: 'Stable observations', description: 'scenario.stable', dataset: rebase(stableData as Dataset) },
  reviewing: { label: 'Change worth reviewing', description: 'scenario.reviewing', dataset: rebase(reviewingData as Dataset) },
  incomplete: { label: 'Incomplete information', description: 'scenario.incomplete', dataset: rebase(incompleteData as Dataset) },
};
