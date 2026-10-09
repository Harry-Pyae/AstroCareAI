import React, { useState } from 'react';
import { Decision } from '../../screens/BriefScreen';

interface DecisionBarProps {
  crewId: string;
  onDecisionSaved: (decision: Decision) => void;
}

type ActionType = "recheck" | "request_review" | "propose_schedule_change";

export const DecisionBar: React.FC<DecisionBarProps> = ({ crewId, onDecisionSaved }) => {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const actionLabels: Record<ActionType, string> = {
    recheck: "Recheck",
    request_review: "Request Review",
    propose_schedule_change: "Propose Schedule Change"
  };

  const handleSave = () => {
    if (!selectedAction) return;
    
    setIsSaving(true);
    
    // Simulate async saving
    setTimeout(() => {
      const decision: Decision = {
        crewId,
        action: selectedAction,
        note: note.trim(),
        timestamp: new Date().toISOString()
      };
      
      onDecisionSaved(decision);
      setSelectedAction(null);
      setNote('');
      setIsSaving(false);
    }, 300);
  };

  const handleCancel = () => {
    setSelectedAction(null);
    setNote('');
  };

  if (selectedAction) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
        <h3 className="text-white font-medium mb-3">
          Recording decision: <span className="text-amber-500">{actionLabels[selectedAction]}</span>
        </h3>
        
        <input 
          type="text" 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note..."
          className="w-full bg-gray-900 border border-gray-600 text-white rounded p-2 text-sm mb-4 focus:outline-none focus:border-amber-500"
          disabled={isSaving}
          maxLength={150}
        />
        
        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save decision'}
          </button>
          <button 
            onClick={handleCancel}
            disabled={isSaving}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <h3 className="text-white font-medium">Record a Decision</h3>
      <div className="flex flex-wrap gap-3">
        {(Object.keys(actionLabels) as ActionType[]).map((action) => (
          <button
            key={action}
            onClick={() => setSelectedAction(action)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            {actionLabels[action]}
          </button>
        ))}
      </div>
    </div>
  );
};
