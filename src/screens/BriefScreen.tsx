import { useI18n } from "../i18n/LanguageProvider";
import { baselineExplanation } from "../i18n/index";
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { computeBaselines } from '../lib/baseline';
import { getCheckinDetails, getCheckins, getDecisions, saveDecision, type CheckinDetails } from '../lib/storage';
import type { CrewMember, Decision, Observation } from '../lib/types';
import { useDemo } from '../components/demo/DemoProvider';
import SelfReportCard from '../components/brief/SelfReportCard';
import BaselineComparison from '../components/brief/BaselineComparison';
import DecisionBar from '../components/brief/DecisionBar';
import SpaceWeatherCard from '../components/spaceweather/SpaceWeatherCard';
import TaskCard from '../components/brief/TaskCard';
import Icon from '../components/icons/Icon';
import { buttonClass } from '../components/ui/Button';
import CrewBadgeDialog from '../components/qr/CrewBadgeDialog';
import { formatTime, metricLabels, metricValue } from '../components/brief/format';
import '../components/brief/dashboard.css';

// Acknowledge only once per running session, including route remounts.
const acknowledgedCheckins = new Set<string>();

function CrewBrief({ member }: { member: CrewMember }) {
  const { t, language, date } = useI18n();
  const { dataset, active: demoActive, version } = useDemo();
  const [now, setNow] = useState(() => new Date());
  const [checkins, setCheckins] = useState<Observation[]>([]);
  const [details, setDetails] = useState<CheckinDetails[]>([]);
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
        setDetails(getCheckinDetails(member.id));
        setDecisions(getDecisions(member.id));
        setStorageMessage('');
        const newest = [...saved].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
        if (newest) {
          const age = time.getTime() - Date.parse(newest.timestamp);
          const key = `${member.id}:${newest.timestamp}`;
          if (age >= 0 && age < 120_000 && !acknowledgedCheckins.has(key)) { acknowledgedCheckins.add(key); setToast(demoActive ? 'Check-in saved to this demo scenario. Recent averages now include it.' : 'Check-in saved. Your recent observations are updated.'); }
        }
      } catch { setCheckins([]); setDetails([]); setDecisions([]); setStorageMessage('Local history is unavailable. Showing synthetic telemetry; browser storage access is needed for saved check-ins and decisions.'); }
    };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(interval); window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); };
  }, [member.id, version, demoActive]);
  const observations = [...dataset.observations, ...checkins].filter(row => row.crewId === member.id);
  const results = computeBaselines(observations, member.id, now);
  const latest = observations.filter(row => Number.isFinite(row.value) && Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) <= now.getTime()).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]?.timestamp;
  const lastCheckin = checkins.filter(row => row.crewId === member.id && Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) <= now.getTime()).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]?.timestamp;
  const task = dataset.tasks.filter(item => item.crewId === member.id && Date.parse(item.scheduledFor) >= now.getTime()).sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor))[0];
  const relevant = [...results].filter(item => item.status === 'worth_reviewing').sort((a, b) => Math.abs(b.deltaPct ?? 0) - Math.abs(a.deltaPct ?? 0))[0];
  const limited = results.filter(item => item.status === 'stale_data' || item.status === 'insufficient_data').length;
  const summary = relevant?.deltaPct === null ? baselineExplanation(relevant, language) : relevant ? t('overview.change', { metric: t(metricLabels[relevant.metric]?.name ?? relevant.metric), current: metricValue(relevant.currentMean, relevant.metric, t), delta: Math.abs(relevant.deltaPct ?? 0).toFixed(0), direction: t(Number(relevant.deltaPct) < 0 ? 'below' : 'above') }) : limited ? t('overview.limited', { count: limited }) : t('Recent observations are within personal baseline range. This is not medical clearance.');
  function recordDecision(action: Decision['action'], note: string) {
    const decision: Decision = { crewId: member.id, action, note, timestamp: new Date().toISOString() };
    if (saveDecision(decision) === false) throw new Error('Decision storage unavailable');
    setDecisions(getDecisions(member.id));
    setToast('Decision saved on this device.');
  }
  return <div className="brief-dashboard">
    <header><Link to="/" className={buttonClass('ghost', 'sm', '-ml-3')}><Icon name="arrow-left" size={16} />{t("All crew")}</Link><div className="brief-overview"><div className="brief-overview-identity"><p className="brief-eyebrow">{t("Personal baseline brief")}</p><h1 className="mt-2">{t("Today's overview")}</h1><p className="mt-3 text-lg font-medium">{member.name} <span className="brief-muted text-sm">· {t(member.role)}</span></p></div><div className="brief-overview-actions"><div className="brief-overview-metadata"><p className="brief-muted text-xs">{t("Latest observation")}: {latest ? <time dateTime={latest}>{date(latest)}</time> : t('No observations available')}</p><p className="brief-muted text-xs">{t("Last check-in")}: {lastCheckin ? <time dateTime={lastCheckin}>{date(lastCheckin)}</time> : t('No check-in recorded yet')}</p></div><div className="flex flex-wrap gap-2"><CrewBadgeDialog member={member} /><Link to={`/crew/${encodeURIComponent(member.id)}/checkin`} className={buttonClass('primary')}>{t("Start check-in")}<Icon name="arrow" size={18} /></Link></div></div></div><p className="brief-summary">{summary}</p></header>
    {storageMessage && <p role="status" className="brief-muted mb-5">{t(storageMessage)}</p>}
    <div className="brief-columns"><div className="brief-stack"><BaselineComparison results={results} observations={observations} now={now} crewId={member.id} /></div><aside className="brief-stack" aria-label={t("Task and next steps")}><TaskCard task={task} now={now} /><SelfReportCard details={details} checkins={checkins} now={now} crewId={member.id} /><DecisionBar decisions={decisions.filter(row => row.crewId === member.id)} onSave={recordDecision} /><SpaceWeatherCard /></aside></div>
    <div role="status" aria-live="polite" aria-atomic="true">{toast && <div className="brief-toast"><Icon name="check" size={18} className="text-accent" />{t(toast)}</div>}</div>
  </div>;
}

export default function BriefScreen() {
  const { t, language, date } = useI18n();
  const { crewId } = useParams<{ crewId: string }>();
  const { dataset } = useDemo();
  const member = dataset.crew.find(item => item.id === crewId);
  if (!member) return <section className="brief-dashboard"><h1>{t("Crew member not found")}</h1><p className="brief-muted mt-3">{t("This link does not match a crew member in the demonstration data.")}</p><Link to="/" className="brief-link mt-4 inline-block">{t("Choose a crew member")}</Link></section>;
  return <CrewBrief key={member.id} member={member} />;
}

export { BriefScreen };
