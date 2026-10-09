import crewData from './crew.json' with { type: 'json' };
import observationData from './observations.json' with { type: 'json' };
import taskData from './tasks.json' with { type: 'json' };
import type { CrewMember, Observation, TaskContext } from '../lib/types';

export interface Dataset {
  crew: CrewMember[];
  observations: Observation[];
  tasks: TaskContext[];
}

/** Shift the synthetic reference and tasks together; personal check-in dates stay real. */
export function rebase(data: Dataset, now = Date.now()): Dataset {
  const newest = data.observations.reduce((max, row) => row.provenance === 'synthetic_telemetry'
    && Number.isFinite(Date.parse(row.timestamp)) ? Math.max(max, Date.parse(row.timestamp)) : max, -Infinity);
  const offset = Number.isFinite(newest) && Number.isFinite(now) ? now - (newest + 3_600_000) : 0;
  const shift = (timestamp: string) => Number.isFinite(Date.parse(timestamp))
    ? new Date(Date.parse(timestamp) + offset).toISOString() : timestamp;
  return {
    crew: data.crew,
    observations: data.observations.map(row => row.provenance === 'synthetic_telemetry'
      ? { ...row, timestamp: shift(row.timestamp) } : { ...row }),
    tasks: data.tasks.map(task => ({ ...task, scheduledFor: shift(task.scheduledFor) })),
  };
}

export const seedDataset: Dataset = { crew: crewData, observations: observationData as Observation[], tasks: taskData };
export const defaultDataset = rebase(seedDataset);
