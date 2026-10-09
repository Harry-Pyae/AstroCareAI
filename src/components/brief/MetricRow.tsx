import React, { useState } from 'react';
import { BaselineResult, Observation } from '../../lib/types';
import { MetricTrendChart } from './MetricTrendChart';

interface MetricRowProps {
  result: BaselineResult;
  observations: Observation[];
  humanReadableName: string;
  unit?: string;
  now: string;
}

export const MetricRow: React.FC<MetricRowProps> = ({ result, observations, humanReadableName, unit = '', now }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'within_range': return 'text-gray-300';
      case 'worth_reviewing': return 'text-amber-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'within_range': return 'Within personal baseline range';
      case 'worth_reviewing': return 'Change worth reviewing';
      case 'insufficient_data': return 'Not enough observations to make a comparison';
      case 'stale_data': return 'Latest observation is outdated';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'within_range': return '✓';
      case 'worth_reviewing': return '⚠️';
      case 'insufficient_data': return '—';
      case 'stale_data': return '⏱️';
      default: return '?';
    }
  };

  const formatValue = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val) || !Number.isFinite(val)) return '—';
    return Number.isInteger(val) ? val.toString() : val.toFixed(2);
  };

  const isActionable = result.status === 'worth_reviewing';
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{humanReadableName}</span>
            <span className={`text-sm flex items-center gap-1 ${getStatusColor(result.status)}`}>
              <span>{getStatusIcon(result.status)}</span>
              <span>{getStatusText(result.status)}</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 font-mono text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">BASELINE</span>
            <span className="text-gray-300">{formatValue(result.baselineMean)} {unit}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">RECENT</span>
            <span className="text-white">{formatValue(result.currentMean)} {unit}</span>
          </div>
          <div className="flex flex-col min-w-[60px] text-right">
            <span className="text-gray-500 text-xs">CHANGE</span>
            <span className={result.status === 'worth_reviewing' ? 'text-amber-500' : 'text-gray-300'}>
              {result.deltaPct !== null ? `${result.deltaPct > 0 ? '+' : ''}${result.deltaPct.toFixed(1)}%` : '—'}
            </span>
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={!isActionable}
            className={`ml-2 p-1 rounded-md transition-colors ${isActionable ? 'text-amber-500 hover:bg-gray-700' : 'text-gray-600 opacity-50 cursor-not-allowed'}`}
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isExpanded && isActionable && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-gray-300 text-sm mb-4">{result.explanation}</p>
          <MetricTrendChart observations={observations} metric={result.metric} now={now} />
        </div>
      )}
    </div>
  );
};
