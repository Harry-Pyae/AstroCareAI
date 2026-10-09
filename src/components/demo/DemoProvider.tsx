import { createContext, useContext, useState, type ReactNode } from 'react';
import { SCENARIOS, SCENARIO_IDS, type ScenarioId } from '../../data/scenarios';
import { defaultDataset, type Dataset } from '../../data/dataset';
import { readDemoState, resetAll, setStorageNamespace, writeDemoState } from '../../lib/storage';

interface DemoState {
  active: boolean;
  scenario: ScenarioId;
}

interface DemoContextValue extends DemoState {
  /** What every screen reads: the active scenario, or the default seeds. */
  dataset: Dataset;
  /** Bumps on enter/exit/switch/reset so screens re-read saved records. */
  version: number;
  enter: (scenario?: ScenarioId) => void;
  exit: () => void;
  setScenario: (scenario: ScenarioId) => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function initialState(): DemoState {
  const saved = readDemoState();
  const scenario = SCENARIO_IDS.find(id => id === saved?.scenario) ?? 'reviewing';
  const state = { active: Boolean(saved?.active && saved.scenario === scenario), scenario };
  // Set before any screen reads storage, so demo records never mix with user records.
  setStorageNamespace(state.active ? 'demo:' : '');
  return state;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const [version, setVersion] = useState(0);

  function apply(next: DemoState) {
    setStorageNamespace(next.active ? 'demo:' : '');
    writeDemoState(next);
    setState(next);
    setVersion(v => v + 1);
  }

  const value: DemoContextValue = {
    ...state,
    dataset: state.active ? SCENARIOS[state.scenario].dataset : defaultDataset,
    version,
    // Each scenario starts clean: demo: records only; user records untouched.
    enter: (scenario = 'reviewing') => { resetAll('demo:'); apply({ active: true, scenario }); },
    exit: () => apply({ ...state, active: false }),
    setScenario: scenario => { resetAll('demo:'); apply({ ...state, scenario }); },
    resetDemo: () => { resetAll('demo:'); setVersion(v => v + 1); },
  };
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

const noop = () => {};
const outside: DemoContextValue = { active: false, scenario: 'reviewing', dataset: defaultDataset, version: 0, enter: noop, exit: noop, setScenario: noop, resetDemo: noop };

/** Works outside the provider too (isolated screen tests): default seeds, demo off. */
export function useDemo(): DemoContextValue {
  return useContext(DemoContext) ?? outside;
}
