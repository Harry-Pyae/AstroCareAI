import React from 'react';
import { Decision } from '../../lib/types';

interface DecisionHistoryProps {
  decisions: Decision[];
}

export const DecisionHistory: React.FC<DecisionHistoryProps> = ({ decisions }) => {
  const actionLabels: Record<string, string> = {
    recheck: "Recheck",
    request_review: "Request Review",
    propose_schedule_change: "Propose Schedule Change"
  };

  if (!decisions || decisions.length === 0) {
    return (
      <div className="mt-6 border-t border-gray-800 pt-6">
        <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider mb-4">Decision History</h3>
        <p className="text-gray-500 text-sm italic">No past decisions recorded.</p>
      </div>
    );
  }

  // Ensure most recent first
  const sortedDecisions = [...decisions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="mt-8 border-t border-gray-800 pt-6">
      <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider mb-4">Decision History</h3>
      <div className="space-y-3">
        {sortedDecisions.map((decision, index) => (
          <div key={index} className="bg-gray-800/50 border border-gray-800 rounded p-4 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-amber-500">
                  {actionLabels[decision.action] || decision.action}
                </span>
                <span className="text-gray-500 text-xs font-mono">
                  {new Date(decision.timestamp).toLocaleString()}
                </span>
              </div>
              {decision.note && (
                <p className="text-gray-300 text-sm mt-2">{decision.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
