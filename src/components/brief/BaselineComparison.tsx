import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BaselineResult, Observation } from '../../lib/types';
import { DAY, freshness, metricLabels, metricValue } from './format';
import Icon from './Icon';

function Status({ result }: { result: BaselineResult }) {
  const content = { within_range: ['check', 'Within range'], worth_reviewing: ['review', 'Worth reviewing'], insufficient_data: ['info', 'Insufficient data'], stale_data: ['clock', 'Stale data'] } as const;
  const [icon, label] = content[result.status];
  return <span className={`brief-status ${result.status === 'worth_reviewing' ? 'brief-status-review' : result.status === 'within_range' ? 'brief-status-good' : ''}`}><Icon name={icon} />{label}</span>;
}

export default function BaselineComparison({ results, observations, now, crewId }: { results: BaselineResult[]; observations: readonly Observation[]; now: Date; crewId: string }) {
  const flagged = results.filter(result => result.status === 'worth_reviewing');
  const [metric, setMetric] = useState(flagged[0]?.metric ?? results[0]?.metric ?? 'hrv');
  const end = now.getTime();
  const valid = observations.filter(row => Number.isFinite(row.value) && Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) <= end);
  const latest = (name: string) => valid.filter(row => row.metric === name).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]?.timestamp;
  const currentExists = (name: string) => valid.some(row => row.metric === name && Date.parse(row.timestamp) >= end - 7 * DAY);
  const baselineExists = (name: string) => valid.filter(row => row.metric === name && Date.parse(row.timestamp) >= end - 28 * DAY && Date.parse(row.timestamp) < end - 7 * DAY).length >= 5;
  const values = (result: BaselineResult) => <div className="brief-values"><span className="brief-value">{currentExists(result.metric) ? metricValue(result.currentMean, result.metric) : '—'}</span><span className="brief-muted">vs {baselineExists(result.metric) ? metricValue(result.baselineMean, result.metric) : '—'} baseline</span>{result.deltaPct !== null && <span className={result.status === 'worth_reviewing' ? 'brief-delta' : 'brief-muted'}>{result.deltaPct > 0 ? '+' : ''}{result.deltaPct.toFixed(1)}%</span>}</div>;
  const result = results.find(item => item.metric === metric);
  const rows = valid.filter(row => row.metric === metric && Date.parse(row.timestamp) >= end - 35 * DAY).map(row => ({ time: Date.parse(row.timestamp), value: row.value })).sort((a, b) => a.time - b.time);
  const label = metricLabels[metric] ?? { name: metric, unit: '' };
  const supporting = results.filter(item => item.status !== 'worth_reviewing').sort((a, b) => Number(b.status !== 'within_range') - Number(a.status !== 'within_range')).slice(0, 4);
  return <>
    <section className={`brief-panel ${flagged.length ? 'brief-review-panel' : ''}`} aria-labelledby="review-heading"><div className="brief-panel-header"><h2 id="review-heading">Changes to review</h2><span className={`brief-status ${flagged.length ? 'brief-status-review' : ''}`}><Icon name={flagged.length ? 'review' : 'info'} />{flagged.length} flagged</span></div><p className="brief-muted">Recent 7-day averages against your own 3-week baseline.</p>
      {flagged.map(item => <article key={item.metric} className="brief-review-row"><div className="brief-row-title"><h3>{metricLabels[item.metric]?.name ?? item.metric}</h3><Status result={item} /></div>{values(item)}<p>{item.explanation}</p><p className="brief-muted mt-2 text-xs">{freshness(latest(item.metric), now)}</p></article>)}
      {!flagged.length && <div className="brief-empty"><p className="font-medium">{results.length ? 'No changes flagged against personal baseline' : 'No comparisons available yet'}</p><p className="mt-2">This is not medical clearance. Missing or stale observations may limit comparisons.</p><Link className="brief-link mt-3 inline-block" to={`/crew/${crewId}/checkin`}>Add a recent check-in</Link></div>}
      <p className="brief-muted mt-5 text-xs">Illustrative demo settings: changes of 15% or more are worth reviewing, not clinical thresholds.</p>
    </section>
    <section className="brief-panel" aria-labelledby="trend-heading"><div className="brief-panel-header"><h2 id="trend-heading">Baseline vs recent trend</h2><div><label htmlFor="trend-metric" className="brief-muted text-xs">Metric · unit</label><select id="trend-metric" className="brief-field" value={metric} onChange={event => setMetric(event.target.value)}>{results.map(item => <option key={item.metric} value={item.metric}>{metricLabels[item.metric]?.name ?? item.metric} ({metricLabels[item.metric]?.unit})</option>)}</select></div></div>
      {rows.length ? <figure aria-label={`${label.name} observations over the last 35 days. Shaded area shows the baseline window.`}><p className="brief-eyebrow">{label.name} · {label.unit}</p><div className="brief-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 10, right: 10, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="var(--brief-chart-grid)" vertical={false} /><XAxis dataKey="time" type="number" domain={[end - 35 * DAY, end]} ticks={[end - 35 * DAY, end - 28 * DAY, end - 14 * DAY, end - 7 * DAY, end]} tickFormatter={time => `${Math.round((time - end) / DAY)}d`} tick={{ fill: 'var(--brief-muted)', fontSize: 11 }} stroke="var(--brief-chart-grid)" /><YAxis width={45} domain={['auto', 'auto']} tick={{ fill: 'var(--brief-muted)', fontSize: 11 }} stroke="var(--brief-chart-grid)" />
        <Tooltip labelFormatter={value => new Date(Number(value)).toLocaleDateString()} formatter={value => [`${value} ${label.unit}`, label.name]} contentStyle={{ background: 'var(--brief-surface)', border: '1px solid var(--brief-border)', borderRadius: 8, color: 'var(--brief-text)' }} /><ReferenceArea x1={end - 28 * DAY} x2={end - 7 * DAY} fill="var(--brief-chart-window)" fillOpacity={0.15} /><Line dataKey="value" name={label.name} type="linear" stroke="var(--brief-chart-line)" strokeWidth={2} dot={rows.length === 1} isAnimationActive={false} />
      </LineChart></ResponsiveContainer></div><figcaption className="brief-chart-legend"><span><span className="brief-chart-swatch" />Shaded: personal baseline · days 28–8</span><span>Recent comparison: last 7 days</span></figcaption></figure> : <p className="brief-empty">No observations for this metric in the last 35 days. <Link className="brief-link" to={`/crew/${crewId}/checkin`}>Start check-in</Link></p>}
      <p className="brief-muted mt-4">{result?.explanation ?? 'Select a metric to compare its recent observations with its personal baseline.'}</p>
    </section>
    <section aria-labelledby="support-heading"><div className="brief-panel-header"><h2 id="support-heading">Other observations</h2><span className="brief-muted text-xs">Current average · last 7 days</span></div><div className="brief-support">{supporting.map(item => <article key={item.metric} className="brief-support-card"><h3>{metricLabels[item.metric]?.name} <span className="brief-muted text-xs">· {metricLabels[item.metric]?.unit}</span></h3><p className="brief-value mt-2">{currentExists(item.metric) ? metricValue(item.currentMean, item.metric) : '—'}</p><p className="brief-muted text-xs">Baseline: {baselineExists(item.metric) ? metricValue(item.baselineMean, item.metric) : 'Not enough observations (needs 5)'}</p><div className="mt-3"><Status result={item} /></div><p className="brief-muted mt-2 text-xs">{item.status === 'insufficient_data' ? (!baselineExists(item.metric) ? 'Not enough baseline observations to compare (needs 5).' : 'No readings in the last 7 days to compare.') : item.deltaPct === null ? 'Percentage change unavailable.' : Math.abs(item.deltaPct) < 0.05 ? 'No change in the recent average.' : `${Math.abs(item.deltaPct).toFixed(1)}% ${item.deltaPct < 0 ? 'below' : 'above'} personal baseline.`}</p><p className="brief-muted mt-2 text-xs">{freshness(latest(item.metric), now)}</p>{(item.status === 'stale_data' || item.status === 'insufficient_data') && <Link to={`/crew/${crewId}/checkin`} className="brief-link mt-2 inline-block text-xs">Record a check-in</Link>}</article>)}</div>
      <details><summary>View all metric comparisons ({results.length})</summary>{results.map(item => <article className="brief-review-row" key={item.metric}><div className="brief-row-title"><h3>{metricLabels[item.metric]?.name}</h3><Status result={item} /></div>{values(item)}<p className="brief-muted">{item.explanation}</p></article>)}</details>
    </section>
  </>;
}
