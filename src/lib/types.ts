export interface CrewMember { id: string; name: string; role: string; }
export interface Observation { crewId: string; metric: "hrv"|"sleep_hours"|
  "exercise_min"|"radiation_msv"|"mood"; value: number; timestamp: string;
  provenance: "synthetic_telemetry"|"user_checkin"; }
export interface BaselineResult { metric: string; baselineMean: number;
  baselineWindowDays: number; currentMean: number; currentWindowDays: number;
  deltaPct: number|null; status: "within_range"|"worth_reviewing"|
  "insufficient_data"|"stale_data"; explanation: string; }
export interface Decision { crewId: string; action: "recheck"|"request_review"|
  "propose_schedule_change"; note: string; timestamp: string; }
export interface TaskContext { crewId: string; title: string; scheduledFor: string;
  attentionDemands: string[]; }
