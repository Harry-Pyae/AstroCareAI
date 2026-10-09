import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ScenarioId } from '../../data/scenarios';
import { SCENARIO_DATA } from '../../data/scenarios';
import { setStorageNamespace, resetAll } from '../../lib/storage';

// Original seeds
import defaultObservations from '../../data/observations.json';
import defaultCrew from '../../data/crew.json';
import defaultTasks from '../../data/tasks.json';

interface DemoContextType {
  active: boolean;
  scenario: ScenarioId;
  enter: (id?: ScenarioId) => void;
  exit: () => void;
  setScenario: (id: ScenarioId) => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

const STORAGE_KEY = 'demo:active_scenario';

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState(false);
  const [scenario, setScenarioState] = useState<ScenarioId>('stable');

  // Initialize from storage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.active && ['stable', 'reviewing', 'incomplete'].includes(parsed.scenario)) {
          setActive(true);
          setScenarioState(parsed.scenario);
          setStorageNamespace('demo:');
        }
      }
    } catch (e) {
      // Corrupted storage, fall back to inactive
      setActive(false);
    }
  }, []);

  const persist = (isActive: boolean, currentScenario: ScenarioId) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ active: isActive, scenario: currentScenario }));
    } catch (e) {
      // Handle gracefully
    }
  };

  const enter = useCallback((id: ScenarioId = 'reviewing') => {
    setActive(true);
    setScenarioState(id);
    setStorageNamespace('demo:');
    persist(true, id);
    // When entering, it's good to reset previous demo decisions so it's a fresh state
    resetAll('demo:');
  }, []);

  const exit = useCallback(() => {
    setActive(false);
    setStorageNamespace('');
    persist(false, scenario);
  }, [scenario]);

  const setScenario = useCallback((id: ScenarioId) => {
    setScenarioState(id);
    persist(active, id);
    if (active) {
      resetAll('demo:');
    }
  }, [active]);

  const resetDemo = useCallback(() => {
    if (active) {
      resetAll('demo:');
      // Trigger a re-render if needed, but storage reset is synchronous
      setScenarioState(prev => prev); 
    }
  }, [active]);

  return (
    <DemoContext.Provider value={{ active, scenario, enter, exit, setScenario, resetDemo }}>
      {children}
    </DemoContext.Provider>
  );
};

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}

// Data hooks that P1 can wire into BriefScreen
export function useObservations() {
  const { active, scenario } = useDemo();
  return active ? SCENARIO_DATA[scenario].observations : defaultObservations;
}

export function useCrew() {
  const { active, scenario } = useDemo();
  return active ? SCENARIO_DATA[scenario].crew : defaultCrew;
}

export function useTasks() {
  const { active, scenario } = useDemo();
  return active ? SCENARIO_DATA[scenario].tasks : defaultTasks;
}
