import React, { useState } from 'react';
import { useDemo } from './DemoProvider';
import { SCENARIOS } from '../../data/scenarios';
import type { ScenarioId } from '../../data/scenarios';

export const DemoControlPanel: React.FC = () => {
  const { isActive, activeScenarioId, setScenario, resetDemo, exitDemo } = useDemo();
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isActive) return null;

  const currentScenarioDesc = activeScenarioId ? SCENARIOS[activeScenarioId].description : '';

  const handleReset = () => {
    if (confirmReset) {
      resetDemo();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-amber-500/50 rounded-lg p-4 shadow-xl max-w-sm text-gray-900 dark:text-gray-300 transition-colors"
      role="region" 
      aria-label="Demo Control Panel"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span 
            className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider"
            aria-live="polite"
          >
            Demo — Synthetic Data
          </span>
        </div>
        <button 
          onClick={exitDemo}
          className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-sm"
          title="Exit Demo Mode"
          aria-label="Exit Demo Mode"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label htmlFor="scenario-selector" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Current Scenario
          </label>
          <select 
            id="scenario-selector"
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-amber-500 focus:outline-none transition-colors"
            value={activeScenarioId || ''}
            onChange={(e) => setScenario(e.target.value as ScenarioId)}
            aria-label="Select Demo Scenario"
          >
            {Object.values(SCENARIOS).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 italic" aria-live="polite">
          {currentScenarioDesc}
        </p>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleReset}
            className={`w-full text-sm py-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              confirmReset 
                ? 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white'
            }`}
            aria-label={confirmReset ? "Confirm Reset Demo Data" : "Reset Demo Data"}
          >
            {confirmReset ? "Click again to confirm reset" : "Reset Demo Data"}
          </button>
        </div>
      </div>
    </div>
  );
};
