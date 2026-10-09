import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { ScenarioId, Scenario } from '../../data/scenarios';
import { clearDemoStorage, getDemoScenario, getSavedScenarioId, saveScenarioId } from '../../lib/demo';

interface DemoContextType {
  isActive: boolean;
  activeScenarioId: ScenarioId | null;
  activeScenario: Scenario | null;
  setScenario: (id: ScenarioId) => void;
  resetDemo: () => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId | null>(() => getSavedScenarioId());

  const setScenario = useCallback((id: ScenarioId) => {
    setActiveScenarioId(id);
    saveScenarioId(id);
    // When switching scenarios, ensure demo storage is reset to prevent contradictory data
    clearDemoStorage();
  }, []);

  const resetDemo = useCallback(() => {
    clearDemoStorage();
    // Re-triggering state update to force re-renders if necessary
    setActiveScenarioId(prev => prev);
  }, []);

  const exitDemo = useCallback(() => {
    setActiveScenarioId(null);
    saveScenarioId(null);
    clearDemoStorage();
  }, []);

  const isActive = activeScenarioId !== null;
  const activeScenario = getDemoScenario(activeScenarioId);

  return (
    <DemoContext.Provider value={{
      isActive,
      activeScenarioId,
      activeScenario,
      setScenario,
      resetDemo,
      exitDemo
    }}>
      {children}
    </DemoContext.Provider>
  );
};
