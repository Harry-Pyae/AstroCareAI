export const DAY = 86_400_000;
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
  const hours = Math.ceil(remaining / 3_600_000);
  return hours < 24 ? `In ${hours} hour${hours === 1 ? '' : 's'}` : `In ${Math.floor(hours / 24)}d ${hours % 24}h`;
}
