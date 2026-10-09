import type { Decision, Observation } from './types';

// A single envelope keeps a check-in's readings and descriptive details atomic.
const STORAGE_KEY = 'astrocare:v1:state';
export type StorageNamespace = '' | 'demo:';
let activeNamespace: StorageNamespace = '';
const METRICS = new Set(['hrv', 'sleep_hours', 'exercise_min', 'radiation_msv', 'mood']);
const ACTIONS = new Set(['recheck', 'request_review', 'propose_schedule_change']);
export const CHECKIN_DUPLICATE_WINDOW_MINUTES = 5;
const CHECKIN_DUPLICATE_WINDOW_MS = CHECKIN_DUPLICATE_WINDOW_MINUTES * 60_000;
export type CheckinSaveResult = 'saved' | 'duplicate' | 'invalid' | 'unavailable';

export const SYMPTOMS = ['none', 'headache', 'congestion', 'back_pain', 'eye_strain', 'other'] as const;
export type Symptom = typeof SYMPTOMS[number];
export const SELF_REPORT_METRICS = new Set<Observation['metric']>(['sleep_hours', 'exercise_min', 'mood']);
const RANGES: Partial<Record<Observation['metric'], [number, number]>> = { sleep_hours: [0, 24], exercise_min: [0, 600], mood: [1, 5] };

/** Descriptive self-report is never interpreted as a baseline metric. */
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
function isSelfReport(value: unknown): value is Observation {
  if (!isObservation(value) || !SELF_REPORT_METRICS.has(value.metric)) return false;
  const range = RANGES[value.metric];
  return Boolean(range && value.value >= range[0] && value.value <= range[1]);
}
function isDecision(value: unknown): value is Decision {
  return isRecord(value) && validIdentity(value)
    && typeof value.action === 'string' && ACTIONS.has(value.action)
    && typeof value.note === 'string';
}
const isRating = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
const optional = (value: unknown, check: (v: unknown) => boolean) => value === undefined || check(value);
function isDetails(value: unknown): value is CheckinDetails {
  return isRecord(value) && validIdentity(value) && isRating(value.fatigue)
    && typeof value.note === 'string' && value.note.length <= 1000
    && optional(value.sleepQuality, isRating) && optional(value.exertion, isRating) && optional(value.stress, isRating)
    && optional(value.symptoms, v => Array.isArray(v) && v.every(item => (SYMPTOMS as readonly unknown[]).includes(item))
      && (!v.includes('none') || v.length === 1))
    && optional(value.symptomOther, v => typeof v === 'string' && v.length <= 120)
    && optional(value.hydrationLiters, v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10);
}
const emptyState = (): StoredState => ({ version: 2, checkins: [], decisions: [], details: [] });
const storageKey = (namespace: StorageNamespace) => `${namespace}${STORAGE_KEY}`;
export function setStorageNamespace(namespace: StorageNamespace): void { activeNamespace = namespace; }
const resolveNamespace = (namespace?: StorageNamespace) => namespace ?? activeNamespace;
function readState(namespace: StorageNamespace): StoredState {
  const raw = window.localStorage.getItem(storageKey(namespace));
  if (raw === null) return emptyState();
  const parsed: unknown = JSON.parse(raw);
  // Additive v1 -> v2 migration: valid original records load without a wipe.
  if (!isRecord(parsed) || (parsed.version !== 1 && parsed.version !== 2)
    || !Array.isArray(parsed.checkins) || !Array.isArray(parsed.decisions) || !Array.isArray(parsed.details)) {
    throw new Error('Unsupported storage format');
  }
  return { version: 2, checkins: parsed.checkins.filter(isObservation), decisions: parsed.decisions.filter(isDecision), details: parsed.details.filter(isDetails) };
}
function newestFirst<T extends { timestamp: string }>(values: T[]): T[] {
  return values.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}
function isDuplicateCheckin(state: StoredState, crewId: string, timestamp: string): boolean {
  const time = Date.parse(timestamp);
  return state.details.some(row => row.crewId === crewId && Math.abs(Date.parse(row.timestamp) - time) < CHECKIN_DUPLICATE_WINDOW_MS)
    || state.checkins.some(row => row.crewId === crewId && Math.abs(Date.parse(row.timestamp) - time) < CHECKIN_DUPLICATE_WINDOW_MS);
}
function notifyStorageChange(): void {
  // A notification failure must not turn an already committed write into "failed".
  try { window.dispatchEvent(new Event('storage')); } catch { /* unavailable in isolated tests/browser environments */ }
}
export function getCheckins(crewId: string, namespace?: StorageNamespace): Observation[] {
  try { return newestFirst(readState(resolveNamespace(namespace)).checkins.filter(item => item.crewId === crewId)); } catch { return []; }
}
export function getDecisions(crewId: string, namespace?: StorageNamespace): Decision[] {
  try { return newestFirst(readState(resolveNamespace(namespace)).decisions.filter(item => item.crewId === crewId)); } catch { return []; }
}
export function getCheckinDetails(crewId: string, namespace?: StorageNamespace): CheckinDetails[] {
  try { return newestFirst(readState(resolveNamespace(namespace)).details.filter(item => item.crewId === crewId)); } catch { return []; }
}

/** Distinguish an empty readable store from blocked/corrupt history, without
 * changing the existing array getters or rewriting any stored records. */
export function getStorageReadStatus(namespace?: StorageNamespace): 'available' | 'unavailable' {
  try {
    readState(resolveNamespace(namespace));
    return 'available';
  } catch {
    return 'unavailable';
  }
}

/** Legacy one-reading callers are supported; writes accept self-report metrics only. */
export function saveCheckin(obs: Observation, namespace?: StorageNamespace): boolean {
  if (!isSelfReport(obs)) return false;
  try {
    const target = resolveNamespace(namespace);
    const state = readState(target);
    if (isDuplicateCheckin(state, obs.crewId, obs.timestamp)) return false;
    state.checkins.push(obs);
    window.localStorage.setItem(storageKey(target), JSON.stringify(state));
    notifyStorageChange();
    return true;
  } catch { return false; }
}

/** Up to three readings and their descriptive details are validated/written together. */
export function saveCheckinEntryResult(input: Observation | Observation[], details: CheckinDetails, namespace?: StorageNamespace): CheckinSaveResult {
  const observations = Array.isArray(input) ? input : [input];
  if (!observations.length || !isDetails(details)
    || observations.some(obs => !isSelfReport(obs) || obs.crewId !== details.crewId || obs.timestamp !== details.timestamp)
    || new Set(observations.map(obs => obs.metric)).size !== observations.length) return 'invalid';
  try {
    const target = resolveNamespace(namespace);
    const state = readState(target);
    if (isDuplicateCheckin(state, details.crewId, details.timestamp)) return 'duplicate';
    state.checkins.push(...observations);
    state.details.push(details);
    window.localStorage.setItem(storageKey(target), JSON.stringify(state));
    notifyStorageChange();
    return 'saved';
  } catch { return 'unavailable'; }
}
export function saveCheckinEntry(input: Observation | Observation[], details: CheckinDetails, namespace?: StorageNamespace): boolean {
  return saveCheckinEntryResult(input, details, namespace) === 'saved';
}
export function saveDecision(decision: Decision, namespace?: StorageNamespace): boolean {
  if (!isDecision(decision)) return false;
  try {
    const target = resolveNamespace(namespace);
    const state = readState(target);
    state.decisions.push(decision);
    window.localStorage.setItem(storageKey(target), JSON.stringify(state));
    notifyStorageChange();
    return true;
  } catch { return false; }
}
export function resetAll(namespace?: StorageNamespace): boolean {
  try {
    window.localStorage.removeItem(storageKey(resolveNamespace(namespace)));
    notifyStorageChange();
    return true;
  } catch { return false; }
}
export function resetUserData(): boolean { return resetAll(''); }
export function resetDemoData(): boolean { return resetAll('demo:'); }
export function getUiPref(name: string): string | null {
  try { return window.localStorage.getItem(`astrocare:ui:${name}`); } catch { return null; }
}
export function setUiPref(name: string, value: string): void {
  try { window.localStorage.setItem(`astrocare:ui:${name}`, value); } catch { /* session preference still works */ }
}
export const DEMO_STATE_KEY = 'demo:astrocare:mode';
export const LEGACY_DEMO_STATE_KEY = 'demo:active_scenario';
export function readDemoState(): { active: boolean; scenario: string } | null {
  for (const key of [DEMO_STATE_KEY, LEGACY_DEMO_STATE_KEY]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) continue;
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { parsed = raw; }
      if (isRecord(parsed) && typeof parsed.active === 'boolean' && typeof parsed.scenario === 'string') {
        return { active: parsed.active, scenario: parsed.scenario === 'review' ? 'reviewing' : parsed.scenario };
      }
      if (typeof parsed === 'string' && ['stable', 'review', 'reviewing', 'incomplete'].includes(parsed)) {
        return { active: true, scenario: parsed === 'review' ? 'reviewing' : parsed };
      }
    } catch { /* blocked or corrupt selection does not block the main seed view */ }
  }
  return null;
}
export function writeDemoState(state: { active: boolean; scenario: string }): void {
  try { window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state)); } catch { /* demo still works for this session */ }
}
