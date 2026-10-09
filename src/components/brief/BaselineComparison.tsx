import React from 'react';
import { BaselineResult, Observation } from '../../lib/types';
import { MetricRow } from './MetricRow';

interface BaselineComparisonProps {
  results: BaselineResult[];
  observations: Observation[];
  now: string;
}

const metricConfig: Record<string, { name: string; unit: string }> = {
  hrv: { name: 'HRV', unit: 'ms' },
  sleep_hours: { name: 'Sleep', unit: 'hrs' },
  exercise_min: { name: 'Exercise', unit: 'min' },
  radiation_msv: { name: 'Radiation', unit: 'mSv' },
  mood: { name: 'Mood', unit: '' }
};

export const BaselineComparison: React.FC<BaselineComparisonProps> = ({ results, observations, now }) => {
  if (!results || results.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center text-gray-400">
        No baseline data available.
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-white mb-4">Personal Baseline Comparison</h2>
      <div className="flex flex-col">
        {results.map((result) => (
          <MetricRow 
            key={result.metric}
            result={result}
            observations={observations}
            humanReadableName={metricConfig[result.metric]?.name || result.metric}
            unit={metricConfig[result.metric]?.unit || ''}
            now={now}
          />
        ))}
      </div>
    </div>
  );
};
