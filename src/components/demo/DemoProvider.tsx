import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { ScenarioId } from '../../data/scenarios';
import { buildScenarioDataset } from '../../data/scenarios';
import { seedDataset, defaultDataset, rebase, type Dataset } from '../../data/dataset';
import { initializeDemoSession, changeDemoSession, type DemoAction, type DemoSession } from '../../lib/demo';
import type { CrewMember, Observation, TaskContext } from '../../lib/types';

interface DemoContextValue extends DemoSession {
  dataset: Dataset;
  data: Dataset;
  version: number;
  storageMessage: string;
  enter: (id?: ScenarioId) => boolean;
  exit: () => boolean;
  setScenario: (id: ScenarioId) => boolean;
  resetDemo: () => boolean;
}
const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(initializeDemoSession);
  const [storageMessage, setStorageMessage] = useState('');
  const transition = useCallback((action: DemoAction) => {
    try {
      const next = changeDemoSession(session, action);
      setStorageMessage('');
      setSession(next);
      return true;
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : 'Demo storage is unavailable.');
      return false;
    }
  }, [session]);
  const enter = useCallback((id: ScenarioId = 'reviewing') => transition({ type: 'enter', scenario: id }), [transition]);
  const exit = useCallback(() => transition({ type: 'exit' }), [transition]);
  const setScenario = useCallback((id: ScenarioId) => transition({ type: 'scenario', scenario: id }), [transition]);
  const resetDemo = useCallback(() => transition({ type: 'reset' }), [transition]);
  const dataset = useMemo(() => session.active ? buildScenarioDataset(session.scenario, session.anchor)
    : rebase(seedDataset, session.anchor), [session.active, session.scenario, session.anchor]);
  return <DemoContext.Provider value={{ ...session, dataset, data: dataset, version: session.revision, storageMessage, enter, exit, setScenario, resetDemo }}>{children}</DemoContext.Provider>;
}
const noop = () => false;
const outside: DemoContextValue = { active: false, scenario: 'reviewing', anchor: Date.now(), revision: 0, version: 0,
  dataset: defaultDataset, data: defaultDataset, storageMessage: '', enter: noop, exit: noop, setScenario: noop, resetDemo: noop };
/** Isolated screen tests can read the same default data without a provider. */
export function useDemo(): DemoContextValue { return useContext(DemoContext) ?? outside; }
export function useObservations(): Observation[] { return useDemo().dataset.observations; }
export function useCrew(): CrewMember[] { return useDemo().dataset.crew; }
export function useTasks(): TaskContext[] { return useDemo().dataset.tasks; }
