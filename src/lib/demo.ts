import type { ScenarioData, ScenarioId } from '../data/scenarios';
import { resetAll, setStorageNamespace } from './storage.ts';

export const DEMO_STORAGE_PREFIX = 'demo:';
export const DEMO_SCENARIO_KEY = `${DEMO_STORAGE_PREFIX}active_scenario`;

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
  // Migrate the earlier standalone name without reviving its mocked screen.
  if (value === 'review') return 'reviewing';
  return value === 'stable' || value === 'reviewing' || value === 'incomplete' ? value : null;
}

export function initializeDemoSession(now = Date.now()): DemoSession {
  const initial: DemoSession = { active: false, scenario: 'stable', revision: 0, anchor: now };
  try {
    const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(DEMO_SCENARIO_KEY);
    if (raw) {
      let saved: unknown;
      try { saved = JSON.parse(raw); } catch { saved = raw; }
      if (typeof saved === 'string') {
        const id = scenarioId(saved);
        if (id) { initial.active = true; initial.scenario = id; }
      } else if (saved && typeof saved === 'object' && 'active' in saved && 'scenario' in saved) {
        const id = scenarioId(saved.scenario);
        if (saved.active === true && id) { initial.active = true; initial.scenario = id; }
      }
    }
  } catch { /* Unavailable/corrupted storage leaves a usable seed-data view. */ }
  // Synchronous initialization protects child reads/saves on a deep-link reload.
  setStorageNamespace(initial.active ? 'demo:' : '');
  return initial;
}

export function changeDemoSession(session: DemoSession, action: DemoAction, now = Date.now()): DemoSession {
  if (action.type === 'reset' && !session.active) return session;
  // Never enumerate arbitrary keys or clear the normal record envelope.
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
  try {
    window.localStorage.setItem(DEMO_SCENARIO_KEY, JSON.stringify({ active: next.active, scenario: next.scenario }));
  } catch { /* The current session can work even when selection persistence fails. */ }
  return next;
}

/** Shift synthetic dates together; personal check-ins keep their actual dates. */
export function rebaseScenarioData(data: ScenarioData, now: number): ScenarioData {
  const latest = data.observations.reduce((end, row) => row.provenance === 'synthetic_telemetry'
    && Number.isFinite(Date.parse(row.timestamp)) ? Math.max(end, Date.parse(row.timestamp)) : end, -Infinity);
  const offset = Number.isFinite(latest) && Number.isFinite(now) ? now - (latest + 3_600_000) : 0;
  const shift = (timestamp: string) => Number.isFinite(Date.parse(timestamp))
    ? new Date(Date.parse(timestamp) + offset).toISOString() : timestamp;
  return {
    crew: data.crew,
    observations: data.observations.map(row => row.provenance === 'synthetic_telemetry'
      ? { ...row, timestamp: shift(row.timestamp) } : { ...row }),
    tasks: data.tasks.map(task => ({ ...task, scheduledFor: shift(task.scheduledFor) })),
  };
}
