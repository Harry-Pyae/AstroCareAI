import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BaselineResult, Observation } from '../../lib/types';
import { DAY, metricLabels } from './format';

const statuses: Record<BaselineResult['status'], { icon: string; label: string; style: string }> = {
  within_range: { icon: '✓', label: 'Within range', style: 'border-teal-800 bg-teal-950/40 text-teal-200' },
  worth_reviewing: { icon: '◇', label: 'Worth reviewing', style: 'border-amber-700 bg-amber-950/40 text-amber-200' },
  insufficient_data: { icon: '○', label: 'Insufficient data', style: 'border-neutral-700 bg-neutral-900 text-neutral-300' },
  stale_data: { icon: '◷', label: 'Stale data', style: 'border-neutral-600 bg-neutral-900 text-neutral-300' },
};

function MetricRow({ result, observations, now }: { result: BaselineResult; observations: readonly Observation[]; now: Date }) {
  const [expanded, setExpanded] = useState(result.status === 'worth_reviewing');
  const { name, unit } = metricLabels[result.metric] ?? { name: result.metric, unit: '' };
  const status = statuses[result.status];
  const end = now.getTime();
  const rows = observations.filter(row => row.metric === result.metric && Number.isFinite(row.value) && Date.parse(row.timestamp) >= end - 35 * DAY && Date.parse(row.timestamp) <= end)
    .map(row => ({ time: Date.parse(row.timestamp), value: row.value }))
    .sort((a, b) => a.time - b.time);
  const baselineCount = rows.filter(row => row.time >= end - 28 * DAY && row.time < end - 7 * DAY).length;
  const missingBaseline = result.status === 'insufficient_data' && baselineCount < 5;
  const currentExists = rows.some(row => row.time >= end - result.currentWindowDays * DAY);
  const number = (value: number) => `${Number(value.toFixed(3))} ${unit}`;
  return (
    <article className={`border-b border-neutral-800 p-5 last:border-b-0 ${result.status === 'worth_reviewing' ? 'bg-amber-950/10' : ''}`}>
      <div className="grid items-center gap-4 sm:grid-cols-[1.5fr_1fr_1fr] lg:grid-cols-[1.5fr_1fr_1fr_.8fr_1.3fr]">
        <h3 className="font-medium text-neutral-100">{name}</h3>
        <div><span className="mb-1 block text-xs text-neutral-500">Personal baseline · {result.baselineWindowDays}d</span><span className="font-mono">{missingBaseline ? '—' : number(result.baselineMean)}</span></div>
        <div><span className="mb-1 block text-xs text-neutral-500">Current average · {result.currentWindowDays}d</span><span className="font-mono">{currentExists ? number(result.currentMean) : '—'}</span></div>
        <div><span className="mb-1 block text-xs text-neutral-500">Change</span><span className={`inline-block rounded px-2 py-1 font-mono text-sm ${result.status === 'worth_reviewing' ? 'bg-amber-950 text-amber-200' : 'bg-neutral-900 text-neutral-300'}`}>{missingBaseline || !currentExists || result.deltaPct === null ? '—' : `${result.deltaPct > 0 ? '+' : ''}${result.deltaPct.toFixed(1)}%`}</span></div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${status.style}`}><span aria-hidden="true">{status.icon}</span>{status.label}</span>
          {result.status === 'worth_reviewing' && <button type="button" aria-expanded={expanded} aria-controls={`detail-${result.metric}`} onClick={() => setExpanded(value => !value)} className="rounded px-2 py-1 text-xs text-amber-200 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-amber-400">{expanded ? 'Hide details' : 'Show details'}</button>}
        </div>
      </div>
      {result.status === 'insufficient_data' && <p className="mt-4 text-sm text-neutral-400">{missingBaseline ? `Not enough baseline observations to compare (needs 5). ${baselineCount} available in the reference period.` : 'No readings in the last 7 days to compare. Add a recent check-in.'}</p>}
      {result.status === 'stale_data' && <p className="mt-4 text-sm text-neutral-400">Newest reading is more than 48 hours old. These values describe earlier observations. Add a recent check-in to refresh the comparison.</p>}
      {result.status === 'worth_reviewing' && expanded && <div id={`detail-${result.metric}`} className="mt-5 rounded-lg border border-neutral-800 bg-neutral-950/70 p-4">
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-300">{result.explanation}</p>
        <figure className="mt-4" aria-label={`${name} observations over the last 35 days. Shaded area shows the personal baseline period.`}>
          <div className="h-40 w-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#262626" vertical={false} />
                <XAxis dataKey="time" type="number" domain={[end - 35 * DAY, end]} ticks={[end - 28 * DAY, end - 7 * DAY, end]} tickFormatter={time => `${Math.round((time - end) / DAY)}d`} stroke="#737373" tick={{ fontSize: 11 }} />
                <YAxis width={45} domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="#737373" />
                <Tooltip labelFormatter={value => new Date(Number(value)).toLocaleDateString()} formatter={value => [`${value} ${unit}`, name]} contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, color: '#e5e5e5' }} />
                <ReferenceArea x1={end - 28 * DAY} x2={end - 7 * DAY} fill="#5eead4" fillOpacity={0.1} />
                <Line dataKey="value" type="linear" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-400"><span><span aria-hidden="true" className="mr-2 inline-block h-2 w-3 bg-teal-200/30" />Shaded: personal baseline · days 28–8</span><span>Recent comparison: last 7 days</span><span>Daily observations · {unit}</span></figcaption>
        </figure>
      </div>}
    </article>
  );
}

export default function BaselineComparison({ results, observations, now }: { results: BaselineResult[]; observations: readonly Observation[]; now: Date }) {
  return <section aria-labelledby="baseline-heading" className="overflow-hidden rounded-xl border border-neutral-800">
    <div className="border-b border-neutral-800 bg-neutral-900/50 p-5"><h2 id="baseline-heading" className="text-lg font-medium text-neutral-100">Your personal baseline</h2><p className="mt-1 text-sm text-neutral-400">Your recent 7 days compared with your own 3-week reference period.</p><p className="mt-2 text-xs text-neutral-500">Illustrative demo settings: a change of 15% or more is worth reviewing. These are not clinical thresholds.</p></div>
    {results.length ? results.map(result => <MetricRow key={result.metric} result={result} observations={observations} now={now} />) : <p className="p-5 text-sm text-neutral-400">No metric comparisons are available yet.</p>}
  </section>;
}
