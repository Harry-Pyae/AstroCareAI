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

export interface CheckinDetails {
  crewId: string;
  timestamp: string;
  fatigue: number;
  note: string;
}

interface StoredState {
  version: 1;
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

function isDetails(value: unknown): value is CheckinDetails {
  return isRecord(value) && validIdentity(value)
    && typeof value.fatigue === 'number' && Number.isInteger(value.fatigue)
    && value.fatigue >= 1 && value.fatigue <= 5
    && typeof value.note === 'string' && value.note.length <= 1000;
}

function emptyState(): StoredState {
  return { version: 1, checkins: [], decisions: [], details: [] };
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
  if (!isRecord(parsed) || parsed.version !== 1
    || !Array.isArray(parsed.checkins) || !Array.isArray(parsed.decisions)
    || !Array.isArray(parsed.details)) {
    throw new Error('Unsupported storage format');
  }
  return {
    version: 1,
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
export function saveCheckin(obs: Observation, namespace?: StorageNamespace): boolean {
  try {
    if (!isObservation(obs)) return false;
    const targetNamespace = resolveNamespace(namespace);
    const state = readState(targetNamespace);
    state.checkins.push(obs);
    window.localStorage.setItem(storageKey(targetNamespace), JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// Fatigue is not mood. Keep it and the optional note outside the shared
// Observation metric union; the brief still receives sleep observations.
export function saveCheckinEntry(obs: Observation, details: CheckinDetails, namespace?: StorageNamespace): boolean {
  try {
    if (!isObservation(obs) || obs.metric !== 'sleep_hours' || obs.value < 0 || obs.value > 24
      || !isDetails(details) || details.crewId !== obs.crewId
      || details.timestamp !== obs.timestamp) return false;
    const targetNamespace = resolveNamespace(namespace);
    const state = readState(targetNamespace);
    state.checkins.push(obs);
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
