import { baselineExplanation } from '../../i18n/index';
import { useI18n } from "../../i18n/LanguageProvider";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BaselineResult, Observation } from '../../lib/types';
import { DAY, freshness, metricLabels, metricValue } from './format';
import Icon from './Icon';
import Select from '../ui/Select';

function Status({ result }: { result: BaselineResult }) {
  const { t, language, date } = useI18n();
  const content = { within_range: ['check', 'Within range'], worth_reviewing: ['review', 'Worth reviewing'], insufficient_data: ['info', 'Insufficient data'], stale_data: ['clock', 'Stale data'] } as const;
  const [icon, label] = content[result.status];
  return <span className={`brief-status ${result.status === 'worth_reviewing' ? 'brief-status-review' : result.status === 'within_range' ? 'brief-status-good' : ''}`}><Icon name={icon} />{t(label)}</span>;
}

export default function BaselineComparison({ results, observations, now, crewId }: { results: BaselineResult[]; observations: readonly Observation[]; now: Date; crewId: string }) {
  const { t, language, date } = useI18n();
  const flagged = results.filter(result => result.status === 'worth_reviewing');
  const [metric, setMetric] = useState(flagged[0]?.metric ?? results[0]?.metric ?? 'hrv');
  const end = now.getTime();
  const valid = observations.filter(row => row.crewId === crewId && Number.isFinite(row.value) && Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) <= end);
  const latest = (name: string) => valid.filter(row => row.metric === name).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]?.timestamp;
  const currentExists = (name: string) => valid.some(row => row.metric === name && Date.parse(row.timestamp) >= end - 7 * DAY);
  const baselineExists = (name: string) => valid.filter(row => row.metric === name && Date.parse(row.timestamp) >= end - 28 * DAY && Date.parse(row.timestamp) < end - 7 * DAY).length >= 5;
  const values = (result: BaselineResult) => <div className="brief-values"><span className="brief-value">{currentExists(result.metric) ? metricValue(result.currentMean, result.metric, t) : '—'}</span><span className="brief-muted">{t('metric.vs', { value: baselineExists(result.metric) ? metricValue(result.baselineMean, result.metric, t) : '—' })}</span>{result.deltaPct !== null && <span className={result.status === 'worth_reviewing' ? 'brief-delta' : 'brief-muted'}>{result.deltaPct > 0 ? '+' : ''}{result.deltaPct.toFixed(1)}%</span>}</div>;
  const result = results.find(item => item.metric === metric);
  const rows = valid.filter(row => row.metric === metric && Date.parse(row.timestamp) >= end - 35 * DAY).map(row => ({ time: Date.parse(row.timestamp), value: row.value })).sort((a, b) => a.time - b.time);
  const label = metricLabels[metric] ?? { name: metric, unit: '' };
  const supporting = results.filter(item => item.status !== 'worth_reviewing').sort((a, b) => Number(b.status !== 'within_range') - Number(a.status !== 'within_range')).slice(0, 4);
  return <>
    <section className={`brief-panel ${flagged.length ? 'brief-review-panel' : ''}`} aria-labelledby="review-heading"><div className="brief-panel-header"><h2 id="review-heading">{t("Changes to review")}</h2><span className={`brief-status ${flagged.length ? 'brief-status-review' : ''}`}><Icon name={flagged.length ? 'review' : 'info'} />{t('flaggedCount', { count: flagged.length })}</span></div><p className="brief-muted">{t("Recent 7-day averages against your own 3-week baseline.")}</p>
      {flagged.map(item => <article key={item.metric} className="brief-review-row"><div className="brief-row-title"><h3>{t(metricLabels[item.metric]?.name ?? item.metric)}</h3><Status result={item} /></div>{values(item)}<p>{baselineExplanation(item, language)}</p><p className="brief-muted mt-2 text-xs">{freshness(latest(item.metric), now, t)}</p></article>)}
      {!flagged.length && <div className="brief-empty"><p className="font-medium">{results.length ? t("No changes flagged against personal baseline") : t("No comparisons available yet")}</p><p className="mt-2">{t("This is not medical clearance. Missing or stale observations may limit comparisons.")}</p><Link className="brief-link mt-3 inline-block" to={`/crew/${crewId}/checkin`}>{t("Add a recent check-in")}</Link></div>}
      <p className="brief-muted mt-5 text-xs">{t("Illustrative demo settings: changes of 15% or more are worth reviewing, not clinical thresholds.")}</p>
    </section>
    <section className="brief-panel" aria-labelledby="trend-heading"><div className="brief-panel-header"><h2 id="trend-heading">{t("Baseline vs recent trend")}</h2><div className="min-w-56"><p className="brief-muted mb-1 text-xs">{t("Metric · unit")}</p><Select id="trend-metric" label={t("Metric · unit")} value={metric} onChange={setMetric} className="w-full" options={results.map(item => ({ value: item.metric, label: `${t(metricLabels[item.metric]?.name ?? item.metric)} (${t(metricLabels[item.metric]?.unit ?? '')})` }))} /></div></div>
      {rows.length ? <figure aria-label={t('chart.description', { metric: t(label.name) })}><p className="brief-eyebrow">{t(label.name)} · {t(label.unit)}</p><div className="brief-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 10, right: 10, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="var(--brief-chart-grid)" vertical={false} /><XAxis dataKey="time" type="number" domain={[end - 35 * DAY, end]} ticks={[end - 35 * DAY, end - 28 * DAY, end - 14 * DAY, end - 7 * DAY, end]} tickFormatter={time => `${Math.round((time - end) / DAY)}${language === 'my' ? 'ရက်' : 'd'}`} tick={{ fill: 'var(--brief-muted)', fontSize: 11 }} stroke="var(--brief-chart-grid)" /><YAxis width={45} domain={['auto', 'auto']} tick={{ fill: 'var(--brief-muted)', fontSize: 11 }} stroke="var(--brief-chart-grid)" />
        <Tooltip labelFormatter={value => date(new Date(Number(value)).toISOString(), { hour: undefined, minute: undefined, timeZoneName: undefined, year: 'numeric' })} formatter={value => [`${value} ${t(label.unit)}`, t(label.name)]} contentStyle={{ background: 'var(--brief-surface)', border: '1px solid var(--brief-border)', borderRadius: 8, color: 'var(--brief-text)' }} /><ReferenceArea x1={end - 28 * DAY} x2={end - 7 * DAY} fill="var(--brief-chart-window)" fillOpacity={1} /><Line dataKey="value" name={t(label.name)} type="linear" stroke="var(--brief-chart-line)" strokeWidth={2} dot={rows.length === 1} isAnimationActive={false} />
      </LineChart></ResponsiveContainer></div><figcaption className="brief-chart-legend"><span><span className="brief-chart-swatch" />{t("Shaded: personal baseline · days 28–8")}</span><span>{t("Recent comparison: last 7 days")}</span></figcaption></figure> : <p className="brief-empty">{t("No observations for this metric in the last 35 days.")} <Link className="brief-link" to={`/crew/${crewId}/checkin`}>{t("Start check-in")}</Link></p>}
      <p className="brief-muted mt-4">{result ? baselineExplanation(result, language) : t('Select a metric to compare its recent observations with its personal baseline.')}</p>
    </section>
    <section aria-labelledby="support-heading"><div className="brief-panel-header"><h2 id="support-heading">{t("Other observations")}</h2><span className="brief-muted text-xs">{t("Current average · last 7 days")}</span></div><div className="brief-support">{supporting.map(item => <article key={item.metric} className="brief-support-card"><h3>{t(metricLabels[item.metric]?.name ?? item.metric)} <span className="brief-muted text-xs">· {t(metricLabels[item.metric]?.unit ?? '')}</span></h3><p className="brief-value mt-2">{currentExists(item.metric) ? metricValue(item.currentMean, item.metric, t) : '—'}</p><p className="brief-muted text-xs">{t("Baseline")}: {baselineExists(item.metric) ? metricValue(item.baselineMean, item.metric, t) : t('Not enough observations (needs 5)')}</p><div className="mt-3"><Status result={item} /></div><p className="brief-muted mt-2 text-xs">{item.status === 'insufficient_data' ? (!baselineExists(item.metric) ? t("Not enough baseline observations to compare (needs 5).") : t("No readings in the last 7 days to compare.")) : item.deltaPct === null ? t('Percentage change unavailable.') : Math.abs(item.deltaPct) < 0.05 ? t('No change in the recent average.') : t('metric.change', { delta: Math.abs(item.deltaPct).toFixed(1), direction: t(item.deltaPct < 0 ? 'below' : 'above') })}</p><p className="brief-muted mt-2 text-xs">{freshness(latest(item.metric), now, t)}</p>{(item.status === 'stale_data' || item.status === 'insufficient_data') && <Link to={`/crew/${crewId}/checkin`} className="brief-link mt-2 inline-block text-xs">{t("Record a check-in")}</Link>}</article>)}</div>
      <details><summary>{t('allMetrics', { count: results.length })}</summary>{results.map(item => <article className="brief-review-row" key={item.metric}><div className="brief-row-title"><h3>{t(metricLabels[item.metric]?.name ?? item.metric)}</h3><Status result={item} /></div>{values(item)}<p className="brief-muted">{baselineExplanation(item, language)}</p></article>)}</details>
    </section>
  </>;
}
