import { crewList, buildObservations, buildTasks, DEFAULT_PROFILES, INCOMPLETE_PROFILES, STABLE_PROFILES, type Profile } from '../profiles.ts';
import type { Dataset } from '../dataset';

export type ScenarioId = 'stable' | 'reviewing' | 'incomplete';
export type ScenarioData = Dataset;
export const SCENARIO_IDS: ScenarioId[] = ['stable', 'reviewing', 'incomplete'];
const PROFILES: Record<ScenarioId, Record<string, Profile>> = {
  stable: STABLE_PROFILES,
  reviewing: DEFAULT_PROFILES,
  incomplete: INCOMPLETE_PROFILES,
};

/** Deterministic profile values, built together against the current session clock. */
export function buildScenarioDataset(id: ScenarioId, now = Date.now()): Dataset {
  return { crew: crewList(), observations: buildObservations(now, PROFILES[id]), tasks: buildTasks(now) };
}
export const SCENARIO_DESCRIPTIONS: Record<ScenarioId, string> = {
  stable: 'scenario.stable',
  reviewing: 'scenario.reviewing',
  incomplete: 'scenario.incomplete',
};
export interface Scenario {
  id: ScenarioId;
  label: string;
  name: string;
  description: string;
  dataset: Dataset;
}
export const SCENARIOS: Record<ScenarioId, Scenario> = {
  stable: { id: 'stable', label: 'Stable observations', name: 'Stable observations', description: SCENARIO_DESCRIPTIONS.stable, dataset: buildScenarioDataset('stable') },
  reviewing: { id: 'reviewing', label: 'Change worth reviewing', name: 'Change worth reviewing', description: SCENARIO_DESCRIPTIONS.reviewing, dataset: buildScenarioDataset('reviewing') },
  incomplete: { id: 'incomplete', label: 'Incomplete information', name: 'Incomplete information', description: SCENARIO_DESCRIPTIONS.incomplete, dataset: buildScenarioDataset('incomplete') },
};
export const SCENARIO_DATA: Record<ScenarioId, Dataset> = {
  stable: SCENARIOS.stable.dataset,
  reviewing: SCENARIOS.reviewing.dataset,
  incomplete: SCENARIOS.incomplete.dataset,
};
