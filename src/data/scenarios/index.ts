import { crewList, buildObservations, buildTasks, DEFAULT_PROFILES, INCOMPLETE_PROFILES, STABLE_PROFILES, type Profile } from '../profiles';
import type { Dataset } from '../dataset';

export type ScenarioId = 'stable' | 'reviewing' | 'incomplete';
export const SCENARIO_IDS: ScenarioId[] = ['stable', 'reviewing', 'incomplete'];

// Generated at load, relative to now: deterministic shape, never stale.
const build = (profiles: Record<string, Profile>): Dataset => {
  const now = Date.now();
  return { crew: crewList(), observations: buildObservations(now, profiles), tasks: buildTasks(now) };
};

// label/description are i18n keys.
export const SCENARIOS: Record<ScenarioId, { label: string; description: string; dataset: Dataset }> = {
  stable: { label: 'Stable observations', description: 'scenario.stable', dataset: build(STABLE_PROFILES) },
  reviewing: { label: 'Change worth reviewing', description: 'scenario.reviewing', dataset: build(DEFAULT_PROFILES) },
  incomplete: { label: 'Incomplete information', description: 'scenario.incomplete', dataset: build(INCOMPLETE_PROFILES) },
};
