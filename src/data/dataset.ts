import crewData from './crew.json';
import observationData from './observations.json';
import taskData from './tasks.json';
import type { CrewMember, Observation, TaskContext } from '../lib/types';

export interface Dataset {
  crew: CrewMember[];
  observations: Observation[];
  tasks: TaskContext[];
}

const HOUR = 3_600_000;

/** Seeds are generated at a fixed reference time with the newest reading one
 * hour before it. Shift every timestamp so that reference lands on `now`:
 * the synthetic demo keeps its designed statuses on any day, never stale. */
export function rebase(data: Dataset, now = Date.now()): Dataset {
  const newest = data.observations.reduce((max, row) => Math.max(max, Date.parse(row.timestamp) || -Infinity), -Infinity);
  if (!Number.isFinite(newest)) return data;
  const offset = now - (newest + HOUR);
  const shift = (timestamp: string) => new Date(Date.parse(timestamp) + offset).toISOString();
  return {
    crew: data.crew,
    observations: data.observations.map(row => ({ ...row, timestamp: shift(row.timestamp) })),
    tasks: data.tasks.map(task => ({ ...task, scheduledFor: shift(task.scheduledFor) })),
  };
}

export const defaultDataset = rebase({ crew: crewData, observations: observationData as Observation[], tasks: taskData });
