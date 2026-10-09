import type { ScenarioData, ScenarioId } from '../data/scenarios';
import { rebase } from '../data/dataset.ts';
import { resetAll, setStorageNamespace, readDemoState, writeDemoState, DEMO_STATE_KEY } from './storage.ts';

export const DEMO_STORAGE_PREFIX = 'demo:';
export const DEMO_SCENARIO_KEY = DEMO_STATE_KEY;
export interface DemoSession {
  active: boolean;
  scenario: ScenarioId;
  revision: number;
  anchor: number;
}
export type DemoAction =
  | { type: 'enter' | 'scenario'; scenario: ScenarioId }
  | { type: 'reset' | 'exit' };
function scenarioId(value: unknown): ScenarioId | null {
  if (value === 'review') return 'reviewing';
  return value === 'stable' || value === 'reviewing' || value === 'incomplete' ? value : null;
}
export function initializeDemoSession(now = Date.now()): DemoSession {
  const saved = readDemoState();
  const id = scenarioId(saved?.scenario);
  const initial: DemoSession = { active: Boolean(saved?.active && id), scenario: id ?? 'reviewing', revision: 0, anchor: now };
  setStorageNamespace(initial.active ? 'demo:' : '');
  return initial;
}
export function changeDemoSession(session: DemoSession, action: DemoAction, now = Date.now()): DemoSession {
  if (action.type === 'reset' && !session.active) return session;
  if ('scenario' in action && !scenarioId(action.scenario)) throw new Error('Unknown demo scenario.');
  // Only the demo envelope is reset; user data and UI preferences are untouched.
  if (action.type !== 'exit' && !resetAll('demo:')) {
    throw new Error('Demo storage could not be reset. Enable browser storage and try again.');
  }
  const next: DemoSession = {
    active: action.type !== 'exit',
    scenario: 'scenario' in action ? action.scenario : session.scenario,
    revision: session.revision + 1,
    anchor: now,
  };
  setStorageNamespace(next.active ? 'demo:' : '');
  writeDemoState({ active: next.active, scenario: next.scenario });
  return next;
}
export function rebaseScenarioData(data: ScenarioData, now: number): ScenarioData { return rebase(data, now); }
