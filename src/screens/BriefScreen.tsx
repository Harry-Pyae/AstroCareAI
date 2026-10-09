import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { computeBaselines } from '../lib/baseline';
import { getCheckins, getDecisions, saveDecision } from '../lib/storage';
import type { CrewMember, Decision, Observation } from '../lib/types';
import { useI18n } from '../i18n/LanguageProvider';
import { baselineExplanation } from '../i18n/index';
import { useCrew, useDemo, useObservations, useTasks } from '../components/demo/DemoProvider';
import BaselineComparison from '../components/brief/BaselineComparison';
import DecisionBar from '../components/brief/DecisionBar';
import TaskCard from '../components/brief/TaskCard';
import SpaceWeatherCard from '../components/spaceweather/SpaceWeatherCard';
import Icon from '../components/icons/Icon';
import { metricLabels, metricValue } from '../components/brief/format';
import '../components/brief/dashboard.css';

const acknowledgedCheckins = new Set<string>();

function CrewBrief({ member }: { member: CrewMember }) {
  const { t, language, date } = useI18n();
  const { active, scenario, revision } = useDemo();
  const telemetry = useObservations();
  const tasks = useTasks();
  const [now, setNow] = useState(() => new Date());
  const [checkins, setCheckins] = useState<Observation[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [storageMessage, setStorageMessage] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const refresh = () => {
      const time = new Date();
      setNow(time);
      try {
        const saved = getCheckins(member.id);
        setCheckins(saved);
        setDecisions(getDecisions(member.id));
        setStorageMessage('');
        const newest = [...saved].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
        if (newest) {
          const age = time.getTime() - Date.parse(newest.timestamp);
          const key = [active, scenario, member.id, newest.timestamp].join(':');
          if (age >= 0 && age < 120_000 && !acknowledgedCheckins.has(key)) {
            acknowledgedCheckins.add(key);
            setToast('Check-in saved. Your recent observations are updated.');
          }
        }
      } catch {
        setCheckins([]);
        setDecisions([]);
        setStorageMessage('Local history is unavailable. Showing synthetic telemetry; browser storage access is needed for saved check-ins and decisions.');
      }
    };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [member.id, active, scenario, revision]);

  const observations = [...telemetry, ...checkins].filter(row => row.crewId === member.id);
  const results = computeBaselines(observations, member.id, now);
  const latest = observations
    .filter(row => Number.isFinite(row.value) && Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) <= now.getTime())
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]?.timestamp;
  const lastCheckin = checkins
    .filter(row => row.crewId === member.id && Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) <= now.getTime())
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]?.timestamp;
  const task = tasks.filter(item => item.crewId === member.id && Date.parse(item.scheduledFor) >= now.getTime())
    .sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor))[0];
  const relevant = results.filter(item => item.status === 'worth_reviewing')
    .sort((a, b) => Math.abs(b.deltaPct ?? 0) - Math.abs(a.deltaPct ?? 0))[0];
  const limited = results.filter(item => item.status === 'stale_data' || item.status === 'insufficient_data').length;
  const summary = relevant?.deltaPct === null
    ? baselineExplanation(relevant, language)
    : relevant
      ? t('overview.change', { metric: t(metricLabels[relevant.metric]?.name ?? relevant.metric), current: metricValue(relevant.currentMean, relevant.metric, t), delta: Math.abs(relevant.deltaPct ?? 0).toFixed(0), direction: t(Number(relevant.deltaPct) < 0 ? 'below' : 'above') })
      : limited ? t('overview.limited', { count: limited })
        : t('Recent observations are within personal baseline range. This is not medical clearance.');

  function recordDecision(action: Decision['action'], note: string) {
    const decision: Decision = { crewId: member.id, action, note, timestamp: new Date().toISOString() };
    if (saveDecision(decision) === false) throw new Error('Decision storage unavailable');
    setDecisions(getDecisions(member.id));
    setToast('Decision saved on this device.');
  }

  return <div className="brief-dashboard text-primary">
    <header>
      <Link to="/" className="brief-link text-accent text-xs">{t('← All crew')}</Link>
      <div className="brief-overview">
        <div className="brief-overview-identity">
          <p className="brief-eyebrow text-secondary">{t('Personal baseline brief')}</p>
          <h1 className="mt-2">{t("Today's overview")}</h1>
          <p className="mt-3 text-lg font-medium">{member.name} <span className="text-secondary text-sm">· {t(member.role)}</span></p>
        </div>
        <div className="brief-overview-actions">
          <div className="brief-overview-metadata text-secondary text-xs">
            <p>{t('Latest observation')}: {latest ? <time dateTime={latest}>{date(latest)}</time> : t('No observations available')}</p>
            <p>{t('Last check-in')}: {lastCheckin ? <time dateTime={lastCheckin}>{date(lastCheckin)}</time> : t('No check-in recorded yet')}</p>
          </div>
          <Link to={'/crew/' + encodeURIComponent(member.id) + '/checkin'} className="brief-button border-accent bg-accent text-on-accent">
            {t('Start check-in')} <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
      <p className="brief-summary border-default">{summary}</p>
    </header>
    {storageMessage && <p role="status" className="text-secondary mb-6">{t(storageMessage)}</p>}
    <div className="brief-columns">
      <div className="brief-stack"><BaselineComparison results={results} observations={observations} now={now} crewId={member.id} /></div>
      <aside className="brief-stack" aria-label={t('Task and next steps')}>
        <TaskCard task={task} now={now} />
        <DecisionBar decisions={decisions.filter(row => row.crewId === member.id)} onSave={recordDecision} />
        <SpaceWeatherCard />
      </aside>
    </div>
    <div role="status" aria-live="polite" aria-atomic="true">
      {toast && <div className="brief-toast border-default bg-card-raised text-primary"><Icon name="check" size={18} />{t(toast)}</div>}
    </div>
  </div>;
}

export default function BriefScreen() {
  const { t } = useI18n();
  const crew = useCrew();
  const { active, scenario, revision } = useDemo();
  const { crewId } = useParams<{ crewId: string }>();
  const member = crew.find(item => item.id === crewId);
  if (!member) return <section className="brief-dashboard text-primary">
    <h1>{t('Crew member not found')}</h1>
    <p className="text-secondary mt-3">{t('This link does not match a crew member in the demonstration data.')}</p>
    <Link to="/" className="brief-link text-accent mt-4 inline-block">{t('Choose a crew member')}</Link>
  </section>;
  return <CrewBrief key={[member.id, active, scenario, revision].join(':')} member={member} />;
}

export { BriefScreen };
