import React from 'react';
import { useDemo } from './DemoProvider';
import { SCENARIOS, ScenarioId } from '../../data/scenarios';

export const DemoControlPanel: React.FC = () => {
  const { isActive, activeScenarioId, setScenario, resetDemo, exitDemo } = useDemo();

  if (!isActive) return null;

  const currentScenarioDesc = activeScenarioId ? SCENARIOS[activeScenarioId].description : '';

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-amber-500/50 rounded-lg p-4 shadow-xl max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
            Demo — Synthetic Data
          </span>
        </div>
        <button 
          onClick={exitDemo}
          className="text-gray-400 hover:text-white text-sm"
          title="Exit Demo Mode"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Scenario</label>
          <select 
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-amber-500 focus:outline-none"
            value={activeScenarioId || ''}
            onChange={(e) => setScenario(e.target.value as ScenarioId)}
          >
            {Object.values(SCENARIOS).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <p className="text-xs text-gray-400 italic">
          {currentScenarioDesc}
        </p>

        <div className="pt-2 border-t border-gray-800">
          <button
            onClick={resetDemo}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm py-1.5 rounded transition-colors"
          >
            Reset Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};
