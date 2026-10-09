import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BaselineComparison } from '../components/brief/BaselineComparison';
import { TaskContextCard } from '../components/brief/TaskContextCard';
import { DecisionBar } from '../components/brief/DecisionBar';
import { DecisionHistory } from '../components/brief/DecisionHistory';

// --- SHARED TYPES (Mocked locally until P2 merges) ---
export interface Observation {
  crewId: string;
  metric: "hrv" | "sleep_hours" | "exercise_min" | "radiation_msv" | "mood";
  value: number;
  timestamp: string;
  provenance: "synthetic_telemetry" | "user_checkin";
}

export interface BaselineResult {
  metric: "hrv" | "sleep_hours" | "exercise_min" | "radiation_msv" | "mood";
  baselineMean: number | null;
  baselineWindowDays: number;
  currentMean: number | null;
  currentWindowDays: number;
  deltaPct: number | null;
  status: "within_range" | "worth_reviewing" | "insufficient_data" | "stale_data";
  explanation: string;
}

export interface Decision {
  crewId: string;
  action: "recheck" | "request_review" | "propose_schedule_change";
  note: string;
  timestamp: string;
}

export interface TaskContext {
  crewId: string;
  title: string;
  scheduledFor: string;
  attentionDemands: string[];
}

// --- MOCK DATA ---
const MOCK_BASELINES: BaselineResult[] = [
  {
    metric: "sleep_hours",
    baselineMean: 7.3,
    baselineWindowDays: 20,
    currentMean: 5.8,
    currentWindowDays: 7,
    deltaPct: -20.5,
    status: "worth_reviewing",
    explanation: "Recent average is significantly below the personal 28-day baseline."
  },
  {
    metric: "hrv",
    baselineMean: 62,
    baselineWindowDays: 20,
    currentMean: 52,
    currentWindowDays: 7,
    deltaPct: -16.1,
    status: "worth_reviewing",
    explanation: "Heart rate variability has dropped compared to historical baseline."
  },
  {
    metric: "radiation_msv",
    baselineMean: 0.12,
    baselineWindowDays: 20,
    currentMean: 0.13,
    currentWindowDays: 7,
    deltaPct: 8.3,
    status: "within_range",
    explanation: "Cumulative exposure is consistent with expected mission profiles."
  },
  {
    metric: "exercise_min",
    baselineMean: null,
    baselineWindowDays: 20,
    currentMean: 45,
    currentWindowDays: 7,
    deltaPct: null,
    status: "insufficient_data",
    explanation: "Not enough historical observations to establish a reliable baseline."
  },
  {
    metric: "mood",
    baselineMean: 4.2,
    baselineWindowDays: 20,
    currentMean: null,
    currentWindowDays: 7,
    deltaPct: null,
    status: "stale_data",
    explanation: "Latest self-reported mood observation is older than 48 hours."
  }
];

// Generate synthetic observations for the chart (approx 35 days)
const MOCK_OBSERVATIONS: Observation[] = [];
const nowTime = Date.now();
const DAY = 24 * 60 * 60 * 1000;
for (let i = 35; i >= 0; i--) {
  const ts = new Date(nowTime - i * DAY).toISOString();
  // HRV trend
  MOCK_OBSERVATIONS.push({
    crewId: 'ac-cmdr-01', metric: 'hrv', timestamp: ts, provenance: 'synthetic_telemetry',
    value: i > 7 ? 60 + Math.random() * 4 : 50 + Math.random() * 4
  });
  // Sleep trend
  MOCK_OBSERVATIONS.push({
    crewId: 'ac-cmdr-01', metric: 'sleep_hours', timestamp: ts, provenance: 'synthetic_telemetry',
    value: i > 7 ? 7 + Math.random() * 1 : 5.5 + Math.random() * 0.5
  });
}

export const BriefScreen: React.FC = () => {
  // Use param if needed, or fallback to the mock commander ID
  const { crewId = 'ac-cmdr-01' } = useParams<{ crewId: string }>();
  
  // Local state for decisions (Mocking P4 Storage)
  const [decisions, setDecisions] = useState<Decision[]>([]);
  
  // Mock Task (48h from now)
  const MOCK_TASK: TaskContext = {
    crewId: crewId,
    title: "Docking approach monitoring",
    scheduledFor: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    attentionDemands: ["Sustained attention", "Fine motor control"]
  };

  const now = useMemo(() => new Date().toISOString(), []);

  const handleSaveDecision = (decision: Decision) => {
    setDecisions(prev => [decision, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] text-gray-300 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-800 pb-6 gap-4">
          <div>
            <div className="text-amber-500 font-bold tracking-widest text-xs mb-2 uppercase">AstroCare Baseline Brief</div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Cmdr. Alex Vance</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
              <span className="font-medium bg-gray-800 px-2 py-0.5 rounded">Commander</span>
              <span className="font-mono">ID: {crewId}</span>
            </div>
          </div>
          
          <div className="flex flex-col md:items-end gap-2">
            <div className="text-xs text-gray-500 flex flex-col md:items-end">
              <span>Latest check-in</span>
              <span className="font-mono text-gray-400">
                {new Date(Date.now() - 3600000).toLocaleString()}
              </span>
            </div>
            <Link 
              to={`/crew/${crewId}/checkin`}
              className="mt-2 inline-flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Start New Check-in
            </Link>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          
          {/* Left Column: Baselines */}
          <div className="lg:col-span-2 space-y-6">
            <BaselineComparison results={MOCK_BASELINES} observations={MOCK_OBSERVATIONS} now={now} />
          </div>
          
          {/* Right Column: Task Context & Actions */}
          <div className="space-y-6">
            <TaskContextCard task={MOCK_TASK} />
            <DecisionBar crewId={crewId} onDecisionSaved={handleSaveDecision} />
            <DecisionHistory decisions={decisions} />
          </div>

        </div>

      </div>
    </div>
  );
};
