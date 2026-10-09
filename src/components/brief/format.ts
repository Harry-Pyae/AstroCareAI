import { translate, type Translator } from '../../i18n/index';
export const DAY = 86_400_000;
export function freshness(timestamp: string | undefined, now: Date, t: Translator = (key, params) => translate('en', key, params)) {
  if (!timestamp) return t('No reading available');
  const elapsed = now.getTime() - Date.parse(timestamp);
  if (!Number.isFinite(elapsed) || elapsed < 0) return t('No current reading available');
  if (elapsed < 3_600_000) return t('Last reading less than an hour ago');
  if (elapsed < DAY) { const hours = Math.floor(elapsed / 3_600_000); return t('freshness.hours', { count: hours }); }
  const days = Math.floor(elapsed / DAY);
  return t('freshness.days', { count: days });
}
export function metricValue(value: number, metric: string, t: Translator = (key, params) => translate('en', key, params)) { const unit = metricLabels[metric]?.unit ?? ''; return `${Number(value.toFixed(3))} ${unit === 'points' ? t('points') : unit}`; }
export const metricLabels: Record<string, { name: string; unit: string }> = {
  hrv: { name: 'Heart rate variability', unit: 'ms' },
  sleep_hours: { name: 'Sleep', unit: 'h' },
  exercise_min: { name: 'Exercise', unit: 'min' },
  radiation_msv: { name: 'Radiation', unit: 'mSv' },
  mood: { name: 'Mood', unit: 'points' },
};
export function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(date) : 'Time unavailable';
}
export function timeUntil(timestamp: string, now: Date, t: Translator = (key, params) => translate('en', key, params)) {
  const remaining = Date.parse(timestamp) - now.getTime();
  if (!Number.isFinite(remaining)) return t('Time unavailable');
  if (remaining <= 0) return t('Scheduled time reached');
  const hours = Math.ceil(remaining / 3_600_000);
  return hours < 24 ? t('task.hours', { count: hours }) : t('task.days', { days: Math.floor(hours / 24), hours: hours % 24 });
}
