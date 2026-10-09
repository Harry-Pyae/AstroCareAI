import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageProvider';
import type { CheckinDetails } from '../../lib/storage';
import type { Observation } from '../../lib/types';
import Icon from '../icons/Icon';
import { buttonClass } from '../ui/Button';
import { DAY, freshness } from './format';

/** Latest self-report, shown descriptively. Stress, symptoms and hydration
 * have no baseline and are never compared or interpreted. */
export default function SelfReportCard({ details, checkins, now, crewId }: { details: CheckinDetails[]; checkins: Observation[]; now: Date; crewId: string }) {
  const { t, date } = useI18n();
  const latest = [...details].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
  const value = (metric: Observation['metric']) => checkins.find(row => row.timestamp === latest?.timestamp && row.metric === metric)?.value;
  const rating = (n?: number) => (n ? t('rating.outOf5', { value: n }) : '—');

  if (!latest) {
    return <section className="brief-panel" aria-labelledby="self-report-heading">
      <h2 id="self-report-heading">{t('Self-reported today')}</h2>
      <p className="brief-empty">{t('No check-in recorded yet. A daily check-in adds sleep, activity and wellbeing notes here.')}</p>
      <Link to={`/crew/${encodeURIComponent(crewId)}/checkin`} className={buttonClass('secondary', 'md', 'mt-4')}>{t('Start check-in')}</Link>
    </section>;
  }

  const sleep = value('sleep_hours');
  const exercise = value('exercise_min');
  const mood = value('mood');
  const symptoms = (latest.symptoms ?? []).filter(item => item !== 'other').map(item => t(`symptom.${item}`));
  if (latest.symptomOther) symptoms.push(latest.symptomOther);
  const rows: [string, string][] = [
    ['Sleep', sleep !== undefined ? `${sleep} h · ${t('quality')} ${rating(latest.sleepQuality)}` : '—'],
    ['Fatigue', rating(latest.fatigue)],
    ['Exercise', exercise !== undefined ? `${exercise} min${latest.exertion ? ` · ${t('effort')} ${rating(latest.exertion)}` : ''}` : t('Not recorded')],
    ['Mood', rating(mood)],
    ['Stress', rating(latest.stress)],
    ['Water intake', latest.hydrationLiters !== undefined ? `${latest.hydrationLiters} L` : t('Not recorded')],
    ['Noticed today', symptoms.length ? symptoms.join(', ') : t('Not recorded')],
  ];
  const old = now.getTime() - Date.parse(latest.timestamp) > DAY;

  return <section className="brief-panel" aria-labelledby="self-report-heading">
    <div className="brief-panel-header">
      <h2 id="self-report-heading">{t('Self-reported today')}</h2>
      <Icon name="checkin" size={18} className="text-secondary" />
    </div>
    <p className="brief-muted text-xs"><time dateTime={latest.timestamp}>{date(latest.timestamp)}</time> · {freshness(latest.timestamp, now, t)}</p>
    {old && <p className="mt-2 flex items-center gap-1.5 text-xs text-accent-review"><Icon name="schedule" size={16} />{t('This check-in is more than a day old.')}</p>}
    <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
      {rows.map(([label, text]) => <div key={label} className="contents"><dt className="text-secondary">{t(label)}</dt><dd className="text-right tabular-nums [overflow-wrap:anywhere]">{text}</dd></div>)}
    </dl>
    {latest.note && <p className="mt-4 border-t border-default pt-3 text-sm text-secondary [overflow-wrap:anywhere]">“{latest.note}”</p>}
    <p className="brief-muted mt-4 text-xs">{t('Self-reported values are shown as recorded and are not compared or interpreted.')}</p>
  </section>;
}
