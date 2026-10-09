import type { BaselineResult, Observation } from './types';

const DAY = 86_400_000;
const METRICS: Observation['metric'][] = ['hrv', 'sleep_hours', 'exercise_min', 'radiation_msv', 'mood'];
const LABELS = { hrv: ['HRV', 'ms'], sleep_hours: ['sleep', 'h'], exercise_min: ['exercise', 'min'], radiation_msv: ['radiation', 'mSv'], mood: ['mood', 'points'] };
const mean = (rows: Observation[]) => rows.length ? rows.reduce((sum, row) => sum + row.value, 0) / rows.length : 0;
const display = (value: number) => Number(value.toFixed(3)).toString();

/** Personal comparison using illustrative demo settings, not clinical thresholds.
 * Windows are [now - 28 days, now - 7 days) and [now - 7 days, now].
 * Insufficient data takes precedence over staleness. Future/invalid readings
 * are excluded. A zero baseline has no defined percentage change.
 */
export function computeBaselines(observations: readonly Observation[], crewId: string, now: Date): BaselineResult[] {
  const end = now.getTime();
  return METRICS.map(metric => {
    const rows = observations.filter(row => row.crewId === crewId && row.metric === metric && Number.isFinite(row.value) && Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) <= end);
    const baseline = rows.filter(row => Date.parse(row.timestamp) >= end - 28 * DAY && Date.parse(row.timestamp) < end - 7 * DAY);
    const current = rows.filter(row => Date.parse(row.timestamp) >= end - 7 * DAY);
    const baselineMean = mean(baseline);
    const currentMean = mean(current);
    const deltaPct = baseline.length && current.length && baselineMean !== 0 ? (currentMean - baselineMean) / Math.abs(baselineMean) * 100 : null;
    const newest = rows.reduce((latest, row) => Math.max(latest, Date.parse(row.timestamp)), -Infinity);
    let status: BaselineResult['status'];
    let explanation: string;
    const [label, unit] = LABELS[metric];
    if (!Number.isFinite(end) || baseline.length < 5 || !current.length) {
      status = 'insufficient_data';
      explanation = `There are not enough observations to compare ${label} with this crew member's 3-week baseline. At least 5 baseline readings and 1 recent reading are needed.`;
    } else if (end - newest > 2 * DAY) {
      status = 'stale_data';
      explanation = `The newest ${label} observation is more than 48 hours old. A recent reading is needed for this comparison.`;
    } else {
      status = deltaPct !== null ? (Math.abs(deltaPct) >= 15 ? 'worth_reviewing' : 'within_range') : (currentMean === baselineMean ? 'within_range' : 'worth_reviewing');
      const comparison = deltaPct === null
        ? `Average ${label} over the last 7 days (${display(currentMean)} ${unit}) is compared with a zero baseline. Percentage change is undefined.`
        : `Average ${label} over the last 7 days (${display(currentMean)} ${unit}) is ${Math.abs(deltaPct).toFixed(0)}% ${deltaPct < 0 ? 'below' : 'above'} this crew member's 3-week baseline (${display(baselineMean)} ${unit}).`;
      explanation = `${comparison} ${status === 'worth_reviewing' ? 'Change worth reviewing.' : 'Within personal baseline range.'}`;
    }
    return { metric, baselineMean, baselineWindowDays: 21, currentMean, currentWindowDays: 7, deltaPct, status, explanation };
  });
}
