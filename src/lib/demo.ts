import { SCENARIOS } from '../data/scenarios';
import type { ScenarioId, Scenario } from '../data/scenarios';

export interface DemoState {
  isActive: boolean;
  activeScenarioId: ScenarioId | null;
}

export const DEMO_STORAGE_PREFIX = 'demo:';
export const DEMO_SCENARIO_KEY = `${DEMO_STORAGE_PREFIX}active_scenario`;

export function getDemoScenario(id: ScenarioId | null): Scenario | null {
  if (!id) return null;
  return SCENARIOS[id] || null;
}

export function isDemoActive(state: DemoState): boolean {
  return state.isActive && state.activeScenarioId !== null;
}

export function clearDemoStorage() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Don't clear the active scenario key during general demo reset
    if (key && key.startsWith(DEMO_STORAGE_PREFIX) && key !== DEMO_SCENARIO_KEY) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

export function getSavedScenarioId(): ScenarioId | null {
  try {
    const saved = localStorage.getItem(DEMO_SCENARIO_KEY) as ScenarioId;
    if (saved && SCENARIOS[saved]) return saved;
  } catch (e) {
    // Handle unavailable storage gracefully
  }
  return null;
}

export function saveScenarioId(id: ScenarioId | null) {
  try {
    if (id) {
      localStorage.setItem(DEMO_SCENARIO_KEY, id);
    } else {
      localStorage.removeItem(DEMO_SCENARIO_KEY);
    }
  } catch (e) {
    // Handle unavailable storage gracefully
  }
}
