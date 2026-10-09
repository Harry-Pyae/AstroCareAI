export const DAY = 86_400_000;
export function freshness(timestamp: string | undefined, now: Date) {
  if (!timestamp) return 'No reading available';
  const elapsed = now.getTime() - Date.parse(timestamp);
  if (!Number.isFinite(elapsed) || elapsed < 0) return 'No current reading available';
  if (elapsed < 3_600_000) return 'Last reading less than an hour ago';
  if (elapsed < DAY) { const hours = Math.floor(elapsed / 3_600_000); return `Last reading ${hours} hour${hours === 1 ? '' : 's'} ago`; }
  const days = Math.floor(elapsed / DAY);
  return `Last reading ${days} day${days === 1 ? '' : 's'} ago`;
}
export function metricValue(value: number, metric: string) { return `${Number(value.toFixed(3))} ${metricLabels[metric]?.unit ?? ''}`; }
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
export function timeUntil(timestamp: string, now: Date) {
  const remaining = Date.parse(timestamp) - now.getTime();
  if (!Number.isFinite(remaining)) return 'Time unavailable';
  if (remaining <= 0) return 'Scheduled time reached';
  const minutes = Math.ceil(remaining / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `In ${hours}h ${minutes % 60}m` : `In ${Math.floor(hours / 24)}d ${hours % 24}h`;
}
