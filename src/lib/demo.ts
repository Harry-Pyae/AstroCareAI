import { ScenarioId, SCENARIOS, Scenario } from '../data/scenarios';

export interface DemoState {
  isActive: boolean;
  activeScenarioId: ScenarioId | null;
}

// Prefix for demo storage
export const DEMO_STORAGE_PREFIX = 'demo:';

export function getDemoScenario(id: ScenarioId | null): Scenario | null {
  if (!id) return null;
  return SCENARIOS[id] || null;
}

export function isDemoActive(state: DemoState): boolean {
  return state.isActive && state.activeScenarioId !== null;
}

export function clearDemoStorage() {
  // Clear only keys starting with "demo:"
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(DEMO_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
