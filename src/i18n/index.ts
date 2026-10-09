import en from './en.json' with { type: 'json' };
import my from './my.json' with { type: 'json' };
import type { BaselineResult } from '../lib/types';

export type Language = 'en' | 'my';
export const LANGUAGE_KEY = 'astrocare:language';
export type Translator = (key: string, params?: Record<string, string | number>) => string;
export function translate(language: Language, key: string, params: Record<string, string | number> = {}): string {
  const dictionary: Record<string, string> = language === 'my' ? my : en;
  const text = dictionary[key] ?? (en as Record<string, string>)[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}
export function localizedDate(value: string, language: Language, options: Intl.DateTimeFormatOptions = {}) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return translate(language, 'Time unavailable');
  const formatter = new Intl.DateTimeFormat('en-GB', { numberingSystem: 'latn', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', ...options });
  if (language === 'en') return formatter.format(date);
  // Explicit labels also work in browsers whose ICU build omits Burmese.
  const months: Record<string, string> = { Jan: 'ဇန်နဝါရီ', Feb: 'ဖေဖော်ဝါရီ', Mar: 'မတ်', Apr: 'ဧပြီ', May: 'မေ', Jun: 'ဇွန်', Jul: 'ဇူလိုင်', Aug: 'ဩဂုတ်', Sep: 'စက်တင်ဘာ', Oct: 'အောက်တိုဘာ', Nov: 'နိုဝင်ဘာ', Dec: 'ဒီဇင်ဘာ', AM: 'နံနက်', PM: 'ညနေ' };
  return formatter.formatToParts(date).map(part => months[part.value] ?? part.value).join('');
}
const names: Record<string, string> = { hrv: 'Heart rate variability', sleep_hours: 'Sleep', exercise_min: 'Exercise', radiation_msv: 'Radiation', mood: 'Mood' };
const units: Record<string, string> = { hrv: 'ms', sleep_hours: 'h', exercise_min: 'min', radiation_msv: 'mSv', mood: 'points' };
export function baselineExplanation(result: BaselineResult, language: Language): string {
  if (language === 'en') return result.explanation;
  const t: Translator = (key, params) => translate(language, key, params);
  const params = { metric: t(names[result.metric] ?? result.metric), current: Number(result.currentMean.toFixed(3)), baseline: Number(result.baselineMean.toFixed(3)), unit: units[result.metric] === 'points' ? t('points') : units[result.metric] ?? '', currentDays: result.currentWindowDays, baselineDays: result.baselineWindowDays, delta: Math.abs(result.deltaPct ?? 0).toFixed(0), direction: t((result.deltaPct ?? 0) < 0 ? 'below' : 'above') };
  if (result.status === 'insufficient_data') return t('baseline.insufficient', params);
  if (result.status === 'stale_data') return t('baseline.stale', params);
  const sentence = result.deltaPct === null ? t('baseline.zero', params) : t('baseline.comparison', params);
  return `${sentence} ${t(result.status === 'worth_reviewing' ? 'Change worth reviewing.' : 'Within personal baseline range.')}`;
}
