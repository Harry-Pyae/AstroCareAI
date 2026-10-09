import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BaselineResult, Observation } from '../../lib/types';
import { baselineExplanation } from '../../i18n/index';
import { useI18n } from '../../i18n/LanguageProvider';
import Icon from '../icons/Icon';
import Select from '../ui/Select';
import { DAY, freshness, metricLabels, metricValue } from './format';

function Status({ result }: { result: BaselineResult }) {
  const { t } = useI18n();
  const content = {
    within_range: ['check', 'Within range'],
    worth_reviewing: ['review', 'Worth reviewing'],
    insufficient_data: ['info', 'Insufficient data'],
    stale_data: ['schedule', 'Stale data'],
  } as const;
  const [icon, label] = content[result.status];
  const color = result.status === 'worth_reviewing' ? 'bg-accent-review/15 text-accent-review'
    : result.status === 'within_range' ? 'bg-card-raised text-accent' : 'bg-card-raised text-secondary';
  return <span className={'brief-status ' + color}><Icon name={icon} size={16} />{t(label)}</span>;
}

function MetricTitle({ metric, unit = false }: { metric: string; unit?: boolean }) {
  const { t } = useI18n();
  const label = metricLabels[metric];
  return <h3 className="brief-metric-title">
    <Icon name={label?.icon ?? 'metrics'} size={18} className="shrink-0 text-secondary" />
    <span>{t(label?.name ?? metric)}{unit && <span className="text-secondary text-xs"> · {t(label?.unit ?? '')}</span>}</span>
  </h3>;
}

export default function BaselineComparison({ results, observations, now, crewId }: {
  results: BaselineResult[]; observations: readonly Observation[]; now: Date; crewId: string;
}) {
  const { t, language, date } = useI18n();
  const flagged = results.filter(result => result.status === 'worth_reviewing');
  const [metric, setMetric] = useState(flagged[0]?.metric ?? results[0]?.metric ?? 'hrv');
  const [expanded, setExpanded] = useState(false);
  const end = now.getTime();
  const valid = observations.filter(row => row.crewId === crewId && Number.isFinite(row.value)
    && Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) <= end);
  const latest = (name: string) => valid.filter(row => row.metric === name)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]?.timestamp;
  const currentExists = (name: string) => valid.some(row => row.metric === name && Date.parse(row.timestamp) >= end - 7 * DAY);
  const baselineExists = (name: string) => valid.filter(row => row.metric === name
    && Date.parse(row.timestamp) >= end - 28 * DAY && Date.parse(row.timestamp) < end - 7 * DAY).length >= 5;
  const values = (item: BaselineResult) => <div className="brief-values">
    <span className="brief-value">{currentExists(item.metric) ? metricValue(item.currentMean, item.metric, t) : '—'}</span>
    <span className="text-secondary">{t('metric.vs', { value: baselineExists(item.metric) ? metricValue(item.baselineMean, item.metric, t) : '—' })}</span>
    {item.deltaPct !== null && <span className={item.status === 'worth_reviewing' ? 'font-semibold text-accent-review' : 'text-secondary'}>
      {item.deltaPct > 0 ? '+' : ''}{item.deltaPct.toFixed(1)}%
    </span>}
  </div>;
  const result = results.find(item => item.metric === metric);
  const rows = valid.filter(row => row.metric === metric && Date.parse(row.timestamp) >= end - 35 * DAY)
    .map(row => ({ time: Date.parse(row.timestamp), value: row.value })).sort((a, b) => a.time - b.time);
  const label = metricLabels[metric] ?? { name: metric, unit: '' };
  const supporting = results.filter(item => item.status !== 'worth_reviewing')
    .sort((a, b) => Number(b.status !== 'within_range') - Number(a.status !== 'within_range')).slice(0, 4);
  const checkinPath = '/crew/' + encodeURIComponent(crewId) + '/checkin';
  const panel = 'brief-panel motion-mount border-default bg-card';

  return <>
    <section className={panel + (flagged.length ? ' brief-review-panel' : '')} aria-labelledby="review-heading">
      <div className="brief-panel-header">
        <h2 id="review-heading">{t('Changes to review')}</h2>
        <span className={'brief-status ' + (flagged.length ? 'bg-accent-review/15 text-accent-review' : 'bg-card-raised text-secondary')}>
          <Icon name={flagged.length ? 'review' : 'info'} size={16} />{t('flaggedCount', { count: flagged.length })}
        </span>
      </div>
      <p className="text-secondary mb-6">{t('Recent 7-day averages against your own 3-week baseline.')}</p>
      {flagged.map(item => <article key={item.metric} className="brief-review-row border-default">
        <div className="brief-row-title"><MetricTitle metric={item.metric} /><Status result={item} /></div>
        {values(item)}
        <p>{baselineExplanation(item, language)}</p>
        <p className="text-secondary mt-2 text-xs">{freshness(latest(item.metric), now, t)}</p>
      </article>)}
      {!flagged.length && <div className="brief-empty text-secondary">
        <p className="font-medium">{results.length ? t('No changes flagged against personal baseline') : t('No comparisons available yet')}</p>
        <p className="mt-2">{t('This is not medical clearance. Missing or stale observations may limit comparisons.')}</p>
        <Link className="brief-link text-accent mt-3 inline-block" to={checkinPath}>{t('Add a recent check-in')}</Link>
      </div>}
      <p className="text-secondary mt-6 text-xs">{t('Illustrative demo settings: changes of 15% or more are worth reviewing, not clinical thresholds.')}</p>
    </section>

    <section className={panel} aria-labelledby="trend-heading">
      <div className="brief-panel-header">
        <h2 id="trend-heading">{t('Baseline vs recent trend')}</h2>
        <div className="min-w-0 w-full sm:w-auto">
          <p className="text-secondary text-xs mb-2">{t('Metric · unit')}</p>
          <Select id="trend-metric" value={metric} onChange={setMetric} label={t('Metric · unit')}
            options={results.map(item => ({ value: item.metric, label: t(metricLabels[item.metric]?.name ?? item.metric) + ' (' + t(metricLabels[item.metric]?.unit ?? '') + ')' }))} />
        </div>
      </div>
      {rows.length ? <figure aria-label={t('chart.description', { metric: t(label.name) })}>
        <p className="brief-eyebrow text-secondary">{t(label.name)} · {t(label.unit)}</p>
        <div className="brief-chart"><ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 10, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="time" type="number" domain={[end - 35 * DAY, end]}
              ticks={[end - 35 * DAY, end - 28 * DAY, end - 14 * DAY, end - 7 * DAY, end]}
              tickFormatter={time => String(Math.round((time - end) / DAY)) + (language === 'my' ? 'ရက်' : 'd')}
              tick={{ fill: 'var(--chart-label)', fontSize: 11 }} stroke="var(--chart-grid)" />
            <YAxis width={45} domain={['auto', 'auto']} tick={{ fill: 'var(--chart-label)', fontSize: 11 }} stroke="var(--chart-grid)" />
            <Tooltip
              labelFormatter={value => date(new Date(Number(value)).toISOString(), { hour: undefined, minute: undefined, timeZoneName: undefined, year: 'numeric' })}
              formatter={value => [String(value) + ' ' + t(label.unit), t(label.name)]}
              contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-secondary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
            <ReferenceArea x1={end - 28 * DAY} x2={end - 7 * DAY} fill="var(--chart-baseline-fill)" fillOpacity={1} />
            <Line dataKey="value" name={t(label.name)} type="linear" stroke="var(--chart-line)" strokeWidth={2} dot={rows.length === 1} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer></div>
        <figcaption className="brief-chart-legend text-secondary">
          <span><span className="brief-chart-swatch" />{t('Shaded: personal baseline · days 28–8')}</span>
          <span>{t('Recent comparison: last 7 days')}</span>
        </figcaption>
      </figure> : <p className="brief-empty text-secondary">
        {t('No observations for this metric in the last 35 days.')} <Link className="brief-link text-accent" to={checkinPath}>{t('Start check-in')}</Link>
      </p>}
      <p className="text-secondary mt-6">{result ? baselineExplanation(result, language)
        : t('Select a metric to compare its recent observations with its personal baseline.')}</p>
    </section>

    <section aria-labelledby="support-heading">
      <div className="brief-panel-header">
        <h2 id="support-heading">{t('Other observations')}</h2>
        <span className="text-secondary text-xs">{t('Current average · last 7 days')}</span>
      </div>
      <div className="brief-support">{supporting.map(item => <article key={item.metric} className="brief-support-card motion-mount border-default bg-card">
        <MetricTitle metric={item.metric} unit />
        <p className="brief-value mt-2">{currentExists(item.metric) ? metricValue(item.currentMean, item.metric, t) : '—'}</p>
        <p className="text-secondary text-xs">{t('Baseline')}: {baselineExists(item.metric) ? metricValue(item.baselineMean, item.metric, t) : t('Not enough observations (needs 5)')}</p>
        <div className="mt-3"><Status result={item} /></div>
        <p className="text-secondary mt-2 text-xs">{item.status === 'insufficient_data'
          ? (!baselineExists(item.metric) ? t('Not enough baseline observations to compare (needs 5).') : t('No readings in the last 7 days to compare.'))
          : item.deltaPct === null ? t('Percentage change unavailable.')
            : Math.abs(item.deltaPct) < 0.05 ? t('No change in the recent average.')
              : t('metric.change', { delta: Math.abs(item.deltaPct).toFixed(1), direction: t(item.deltaPct < 0 ? 'below' : 'above') })}</p>
        <p className="text-secondary mt-2 text-xs">{freshness(latest(item.metric), now, t)}</p>
        {(item.status === 'stale_data' || item.status === 'insufficient_data') && <Link to={checkinPath} className="brief-link text-accent mt-2 inline-block text-xs">{t('Record a check-in')}</Link>}
      </article>)}</div>
      <details className="brief-disclosure" onToggle={event => setExpanded(event.currentTarget.open)}>
        <summary className="text-accent">{t('allMetrics', { count: results.length })}</summary>
        <div className={expanded ? 'motion-mount' : ''}>{results.map(item => <article className="brief-review-row border-default" key={item.metric}>
          <div className="brief-row-title"><MetricTitle metric={item.metric} /><Status result={item} /></div>
          {values(item)}<p className="text-secondary">{baselineExplanation(item, language)}</p>
        </article>)}</div>
      </details>
    </section>
  </>;
}
