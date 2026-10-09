import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { ScenarioId, ScenarioData } from '../../data/scenarios';
import { SCENARIO_DATA } from '../../data/scenarios';
import { initializeDemoSession, changeDemoSession, rebaseScenarioData, type DemoAction, type DemoSession } from '../../lib/demo';
import type { CrewMember, Observation, TaskContext } from '../../lib/types';
import defaultObservations from '../../data/observations.json';
import defaultCrew from '../../data/crew.json';
import defaultTasks from '../../data/tasks.json';
import { DemoControlPanel } from './DemoControlPanel';

interface DemoContextType extends DemoSession {
  data: ScenarioData;
  storageMessage: string;
  enter: (id?: ScenarioId) => void;
  exit: () => void;
  setScenario: (id: ScenarioId) => void;
  resetDemo: () => void;
}

const defaultData: ScenarioData = {
  crew: defaultCrew as CrewMember[],
  observations: defaultObservations as Observation[],
  tasks: defaultTasks as TaskContext[],
};

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(initializeDemoSession);
  const [storageMessage, setStorageMessage] = useState('');
  const transition = useCallback((action: DemoAction) => {
    try {
      const next = changeDemoSession(session, action);
      setStorageMessage('');
      setSession(next);
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : 'Demo storage is unavailable.');
    }
  }, [session]);
  const enter = useCallback((id: ScenarioId = 'reviewing') => transition({ type: 'enter', scenario: id }), [transition]);
  const exit = useCallback(() => transition({ type: 'exit' }), [transition]);
  const setScenario = useCallback((id: ScenarioId) => transition({ type: 'scenario', scenario: id }), [transition]);
  const resetDemo = useCallback(() => transition({ type: 'reset' }), [transition]);
  const data = useMemo(() => {
    const defaults = rebaseScenarioData(defaultData, session.anchor);
    if (!session.active) return defaults;
    const chosen = rebaseScenarioData(SCENARIO_DATA[session.scenario], session.anchor);
    const scenarioCrews = new Set(chosen.tasks.map(task => task.crewId));
    return { ...chosen, tasks: [...chosen.tasks, ...defaults.tasks.filter(task => !scenarioCrews.has(task.crewId))] };
  }, [session.active, session.scenario, session.anchor]);
  return <DemoContext.Provider value={{ ...session, data, storageMessage, enter, exit, setScenario, resetDemo }}>
    {children}
    <DemoControlPanel />
  </DemoContext.Provider>;
}

export function useDemo(): DemoContextType {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
}

export function useObservations(): Observation[] { return useDemo().data.observations; }
export function useCrew(): CrewMember[] { return useDemo().data.crew; }
export function useTasks(): TaskContext[] { return useDemo().data.tasks; }
