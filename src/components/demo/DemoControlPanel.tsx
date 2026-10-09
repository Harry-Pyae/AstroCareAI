import React, { useState } from 'react';
import { useDemo } from './DemoProvider';
import { SCENARIO_DESCRIPTIONS } from '../../data/scenarios';
import type { ScenarioId } from '../../data/scenarios';

const buttonClass =
  'inline-flex min-h-11 items-center gap-2 rounded-lg border border-default px-3 text-sm text-secondary hover:border-strong hover:text-primary';

export function DemoControlPanel() {
  const { active, scenario, setScenario, resetDemo } = useDemo();
  const [confirmReset, setConfirmReset] = useState(false);

  if (!active) return null;

  const handleReset = () => {
    if (confirmReset) {
      resetDemo();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  const currentDesc = SCENARIO_DESCRIPTIONS[scenario] || '';

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[90%] max-w-sm rounded-xl border border-default bg-page shadow-lg p-4 text-primary transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Demo Control</h3>
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-accent-review/40 bg-accent-review/10 px-3 text-xs font-medium text-accent-review">
          <span aria-hidden="true">✨</span> Synthetic Data
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="scenario-select" className="mb-1 block text-sm font-medium text-secondary">
            Scenario
          </label>
          <select
            id="scenario-select"
            value={scenario}
            onChange={(e) => setScenario(e.target.value as ScenarioId)}
            className="min-h-11 w-full rounded-lg border border-default bg-card px-3 text-sm text-primary"
          >
            {Object.entries(SCENARIO_DESCRIPTIONS).map(([id, desc]) => (
              <option key={id} value={id}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-secondary" aria-live="polite">
            {currentDesc}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleReset}
            className={`min-h-11 w-full rounded-lg px-3 text-sm font-medium transition-colors ${
              confirmReset
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'border border-default bg-card text-secondary hover:border-strong hover:text-primary'
            }`}
            aria-live="polite"
          >
            {confirmReset ? 'Click to confirm reset' : 'Reset demo data'}
          </button>
        </div>
      </div>
    </div>
  );
}
