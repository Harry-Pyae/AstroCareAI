import type { Decision, Observation } from './types';

// Only this module accesses browser storage. One envelope makes a check-in
// observation and its supplemental details an atomic write.
const STORAGE_KEY = 'astrocare:v1:state';
// The optional prefix keeps scenario records separate; the empty default
// preserves the existing user-data key and reset scope.
export type StorageNamespace = '' | 'demo:';
let activeNamespace: StorageNamespace = '';
const METRICS = new Set(['hrv', 'sleep_hours', 'exercise_min', 'radiation_msv', 'mood']);
const ACTIONS = new Set(['recheck', 'request_review', 'propose_schedule_change']);

export const SYMPTOMS = ['none', 'headache', 'congestion', 'back_pain', 'eye_strain', 'other'] as const;
export type Symptom = typeof SYMPTOMS[number];
// Self-report metrics that also exist as baseline Observation metrics. HRV and
// radiation stay synthetic telemetry and are never accepted from a check-in.
export const SELF_REPORT_METRICS = new Set<Observation['metric']>(['sleep_hours', 'exercise_min', 'mood']);
const RANGES: Partial<Record<Observation['metric'], [number, number]>> = { sleep_hours: [0, 24], exercise_min: [0, 600], mood: [1, 5] };

/** Descriptive self-report kept outside the Observation union (v2 fields optional). */
export interface CheckinDetails {
  crewId: string;
  timestamp: string;
  fatigue: number;
  note: string;
  sleepQuality?: number;
  exertion?: number;
  stress?: number;
  symptoms?: Symptom[];
  symptomOther?: string;
  hydrationLiters?: number;
}

interface StoredState {
  version: 2;
  checkins: Observation[];
  decisions: Decision[];
  details: CheckinDetails[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validIdentity(value: Record<string, unknown>): boolean {
  return typeof value.crewId === 'string' && value.crewId.trim().length > 0
    && typeof value.timestamp === 'string' && Number.isFinite(Date.parse(value.timestamp));
}

function isObservation(value: unknown): value is Observation {
  return isRecord(value) && validIdentity(value)
    && typeof value.metric === 'string' && METRICS.has(value.metric)
    && typeof value.value === 'number' && Number.isFinite(value.value)
    && value.provenance === 'user_checkin';
}

function isDecision(value: unknown): value is Decision {
  return isRecord(value) && validIdentity(value)
    && typeof value.action === 'string' && ACTIONS.has(value.action)
    && typeof value.note === 'string';
}

const isRating = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
const optional = (value: unknown, check: (v: unknown) => boolean) => value === undefined || check(value);

function isDetails(value: unknown): value is CheckinDetails {
  return isRecord(value) && validIdentity(value)
    && isRating(value.fatigue)
    && typeof value.note === 'string' && value.note.length <= 1000
    && optional(value.sleepQuality, isRating) && optional(value.exertion, isRating) && optional(value.stress, isRating)
    && optional(value.symptoms, v => Array.isArray(v) && v.every(item => (SYMPTOMS as readonly unknown[]).includes(item)))
    && optional(value.symptomOther, v => typeof v === 'string' && v.length <= 120)
    && optional(value.hydrationLiters, v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10);
}

function emptyState(): StoredState {
  return { version: 2, checkins: [], decisions: [], details: [] };
}

// Call only within a public operation's try/catch, including the property
// access: even window.localStorage can throw when storage is disabled.
function storageKey(namespace: StorageNamespace): string {
  return `${namespace}${STORAGE_KEY}`;
}

// A DemoProvider can switch the default namespace for existing screens while
// callers that need it can still pass an explicit namespace to any operation.
export function setStorageNamespace(namespace: StorageNamespace): void {
  activeNamespace = namespace;
}

function resolveNamespace(namespace?: StorageNamespace): StorageNamespace {
  return namespace ?? activeNamespace;
}

function readState(namespace: StorageNamespace): StoredState {
  const raw = window.localStorage.getItem(storageKey(namespace));
  if (raw === null) return emptyState();
  const parsed: unknown = JSON.parse(raw);
  // v1 -> v2 is additive (new optional detail fields), so v1 records load
  // unchanged and are rewritten as v2 on the next save. Never wipe.
  if (!isRecord(parsed) || (parsed.version !== 1 && parsed.version !== 2)
    || !Array.isArray(parsed.checkins) || !Array.isArray(parsed.decisions)
    || !Array.isArray(parsed.details)) {
    throw new Error('Unsupported storage format');
  }
  return {
    version: 2,
    checkins: parsed.checkins.filter(isObservation),
    decisions: parsed.decisions.filter(isDecision),
    details: parsed.details.filter(isDetails),
  };
}

function newestFirst<T extends { timestamp: string }>(values: T[]): T[] {
  return values.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

export function getCheckins(crewId: string, namespace?: StorageNamespace): Observation[] {
  try {
    return newestFirst(readState(resolveNamespace(namespace)).checkins.filter((item) => item.crewId === crewId));
  } catch {
    return [];
  }
}

export function getDecisions(crewId: string, namespace?: StorageNamespace): Decision[] {
  try {
    return newestFirst(readState(resolveNamespace(namespace)).decisions.filter((item) => item.crewId === crewId));
  } catch {
    return [];
  }
}

export function getCheckinDetails(crewId: string, namespace?: StorageNamespace): CheckinDetails[] {
  try {
    return newestFirst(readState(resolveNamespace(namespace)).details.filter((item) => item.crewId === crewId));
  } catch {
    return [];
  }
}

// Boolean results let callers avoid claiming a failed write was saved.
// One check-in = up to three Observations (sleep, exercise, mood) plus the
// descriptive details, written atomically. Duplicate guard: a second check-in
// for the same crew member within 60 seconds is rejected (double-submit).
export function saveCheckinEntry(observations: Observation[], details: CheckinDetails, namespace?: StorageNamespace): boolean {
  try {
    if (!observations.length || !isDetails(details)) return false;
    for (const obs of observations) {
      const range = RANGES[obs.metric];
      if (!isObservation(obs) || !SELF_REPORT_METRICS.has(obs.metric) || !range || obs.value < range[0] || obs.value > range[1]
        || obs.crewId !== details.crewId || obs.timestamp !== details.timestamp) return false;
    }
    if (new Set(observations.map(obs => obs.metric)).size !== observations.length) return false;
    const targetNamespace = resolveNamespace(namespace);
    const state = readState(targetNamespace);
    const time = Date.parse(details.timestamp);
    if (state.details.some(row => row.crewId === details.crewId && Math.abs(Date.parse(row.timestamp) - time) < 60_000)) return false;
    state.checkins.push(...observations);
    state.details.push(details);
    window.localStorage.setItem(storageKey(targetNamespace), JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function saveDecision(decision: Decision, namespace?: StorageNamespace): boolean {
  try {
    if (!isDecision(decision)) return false;
    const targetNamespace = resolveNamespace(namespace);
    const state = readState(targetNamespace);
    state.decisions.push(decision);
    window.localStorage.setItem(storageKey(targetNamespace), JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function resetAll(namespace?: StorageNamespace): boolean {
  try {
    window.localStorage.removeItem(storageKey(resolveNamespace(namespace)));
    return true;
  } catch {
    return false;
  }
}

// UI preferences (e.g. sidebar) live under their own key and never touch
// user or demo records. index.html reads 'astrocare:ui:sidebar' pre-paint.
export function getUiPref(name: string): string | null {
  try {
    return window.localStorage.getItem(`astrocare:ui:${name}`);
  } catch {
    return null;
  }
}

export function setUiPref(name: string, value: string): void {
  try {
    window.localStorage.setItem(`astrocare:ui:${name}`, value);
  } catch {
    // preference simply isn't remembered
  }
}

const DEMO_STATE_KEY = 'demo:astrocare:mode';

export function readDemoState(): { active: boolean; scenario: string } | null {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(DEMO_STATE_KEY) ?? 'null');
    return isRecord(parsed) && typeof parsed.active === 'boolean' && typeof parsed.scenario === 'string'
      ? { active: parsed.active, scenario: parsed.scenario } : null;
  } catch {
    return null;
  }
}

export function writeDemoState(state: { active: boolean; scenario: string }): void {
  try {
    window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
  } catch {
    // demo still works for this session
  }
}
