import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CrewMember, Observation, TaskContext, BaselineResult, Decision } from '../lib/types';
import { computeBaselines } from '../lib/baseline';
import { getDecisions, getCheckins } from '../lib/storage';

// In a real app these might be fetched asynchronously, but per P2's contract they are static JSON
import crewData from '../data/crew.json';
import observationsData from '../data/observations.json';
import tasksData from '../data/tasks.json';

import { BaselineComparison } from '../components/brief/BaselineComparison';
import { TaskContextCard } from '../components/brief/TaskContextCard';
import { DecisionBar } from '../components/brief/DecisionBar';
import { DecisionHistory } from '../components/brief/DecisionHistory';

export const BriefScreen: React.FC = () => {
  const { crewId } = useParams<{ crewId: string }>();
  
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [latestCheckinTime, setLatestCheckinTime] = useState<string | null>(null);

  // Load static data safely
  const crewMembers: CrewMember[] = (crewData as any)?.crew || crewData || [];
  const allObservations: Observation[] = (observationsData as any)?.observations || observationsData || [];
  const allTasks: TaskContext[] = (tasksData as any)?.tasks || tasksData || [];

  const member = crewMembers.find(c => c.id === crewId);
  const task = allTasks.find(t => t.crewId === crewId) || null;
  const observations = [...allObservations, ...getCheckins(crewId ?? '')].filter(o => o.crewId === crewId);

  // Use a fixed "now" or current time. A mission dashboard often uses real time.
  // Using current time. Note: if demo data is fixed in the past, this might affect baseline windows.
  // The prompt says: "use computeBaselines(observations, crewId, now)".
  const now = new Date().toISOString(); 
  
  const baselineResults = useMemo(() => {
    if (!crewId) return [];
    try {
      return computeBaselines(observations, crewId, new Date(now));
    } catch (e) {
      console.error("Failed to compute baselines:", e);
      return [];
    }
  }, [observations, crewId, now]);

  const refreshDecisions = () => {
    if (crewId) {
      try {
        const storedDecisions = getDecisions(crewId);
        setDecisions(storedDecisions || []);
      } catch (e) {
        console.error("Failed to fetch decisions", e);
      }
    }
  };

  const loadCheckinTime = () => {
    if (crewId) {
      try {
        const checkins = getCheckins(crewId);
        if (checkins && checkins.length > 0) {
          // Assuming checkins have a timestamp property
          const latest = checkins.sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          setLatestCheckinTime(latest.timestamp);
        }
      } catch (e) {
        console.error("Failed to fetch checkins", e);
      }
    }
  };

  useEffect(() => {
    refreshDecisions();
    loadCheckinTime();
  }, [crewId]);

  if (!crewId || !member) {
    return (
      <div className="min-h-screen bg-[#0a0f18] text-gray-300 p-8 font-sans flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-2">Crew Member Not Found</h2>
          <p className="text-gray-400 mb-6">
            The requested crew ID ({crewId || 'none'}) does not match any active roster entries.
          </p>
          <Link to="/" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors">
            Return to Roster
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] text-gray-300 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-800 pb-6 gap-4">
          <div>
            <div className="text-amber-500 font-bold tracking-widest text-xs mb-2 uppercase">AstroCare Baseline Brief</div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{member.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
              <span className="font-medium bg-gray-800 px-2 py-0.5 rounded">{member.role}</span>
              <span className="font-mono">ID: {member.id}</span>
            </div>
          </div>
          
          <div className="flex flex-col md:items-end gap-2">
            {latestCheckinTime ? (
              <div className="text-xs text-gray-500 flex flex-col md:items-end">
                <span>Latest check-in</span>
                <span className="font-mono text-gray-400">
                  {new Date(latestCheckinTime).toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="text-xs text-gray-500">No recent check-ins</div>
            )}
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
          
          {/* Left Column: Baselines (takes up more space) */}
          <div className="lg:col-span-2 space-y-6">
            <BaselineComparison results={baselineResults} observations={observations} now={now} />
          </div>
          
          {/* Right Column: Task Context & Actions */}
          <div className="space-y-6">
            <TaskContextCard task={task} />
            <DecisionBar crewId={crewId} onDecisionSaved={refreshDecisions} />
            <DecisionHistory decisions={decisions} />
          </div>

        </div>

      </div>
    </div>
  );
};
