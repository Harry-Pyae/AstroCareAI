import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import crewData from '../data/crew.json';
import observationData from '../data/observations.json';
import taskData from '../data/tasks.json';
import { computeBaselines } from '../lib/baseline';
import { getCheckins, getDecisions, saveDecision } from '../lib/storage';
import type { CrewMember, Decision, Observation, TaskContext } from '../lib/types';
import BaselineComparison from '../components/brief/BaselineComparison';
import DecisionBar from '../components/brief/DecisionBar';
import TaskCard from '../components/brief/TaskCard';
import Icon from '../components/brief/Icon';
import { formatTime, metricLabels, metricValue } from '../components/brief/format';
import '../components/brief/dashboard.css';

const crew = crewData as CrewMember[];
const telemetry = observationData as Observation[];
const tasks = taskData as TaskContext[];
// Acknowledge only once per running session, including route remounts.
const acknowledgedCheckins = new Set<string>();

function CrewBrief({ member }: { member: CrewMember }) {
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
          const key = `${member.id}:${newest.timestamp}`;
          if (age >= 0 && age < 120_000 && !acknowledgedCheckins.has(key)) { acknowledgedCheckins.add(key); setToast('Check-in saved. Your recent observations are updated.'); }
        }
      } catch { setCheckins([]); setDecisions([]); setStorageMessage('Local history is unavailable. Showing synthetic telemetry; browser storage access is needed for saved check-ins and decisions.'); }
    };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(interval); window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); };
  }, [member.id]);
  const observations = [...telemetry, ...checkins].filter(row => row.crewId === member.id);
  const results = computeBaselines(observations, member.id, now);
  const latest = observations.filter(row => Number.isFinite(row.value) && Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) <= now.getTime()).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]?.timestamp;
  const lastCheckin = checkins.filter(row => row.crewId === member.id && Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) <= now.getTime()).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]?.timestamp;
  const task = tasks.filter(item => item.crewId === member.id && Date.parse(item.scheduledFor) >= now.getTime()).sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor))[0];
  const relevant = [...results].filter(item => item.status === 'worth_reviewing').sort((a, b) => Math.abs(b.deltaPct ?? 0) - Math.abs(a.deltaPct ?? 0))[0];
  const limited = results.filter(item => item.status === 'stale_data' || item.status === 'insufficient_data').length;
  const summary = relevant?.deltaPct === null ? relevant.explanation : relevant ? `${metricLabels[relevant.metric]?.name} averages ${metricValue(relevant.currentMean, relevant.metric)}, ${Math.abs(relevant.deltaPct ?? 0).toFixed(0)}% ${Number(relevant.deltaPct) < 0 ? 'below' : 'above'} your personal baseline. Change worth reviewing.` : limited ? `${limited} metric${limited === 1 ? '' : 's'} need fresher or more observations before a comparison can be made.` : 'Recent observations are within personal baseline range. This is not medical clearance.';
  function recordDecision(action: Decision['action'], note: string) {
    const decision: Decision = { crewId: member.id, action, note, timestamp: new Date().toISOString() };
    if (saveDecision(decision) === false) throw new Error('Decision storage unavailable');
    setDecisions(getDecisions(member.id));
    setToast('Decision saved on this device.');
  }
  return <div className="brief-dashboard">
    <header><Link to="/" className="brief-link text-xs">← All crew</Link><div className="brief-overview"><div><p className="brief-eyebrow">Personal baseline brief</p><h1 className="mt-2">Today's overview</h1><p className="mt-3 text-lg font-medium">{member.name} <span className="brief-muted text-sm">· {member.role}</span></p><p className="brief-muted mt-1 text-xs">Latest observation: {latest ? <time dateTime={latest}>{formatTime(latest)}</time> : 'No observations available'}</p><p className="brief-muted text-xs">Last check-in: {lastCheckin ? <time dateTime={lastCheckin}>{formatTime(lastCheckin)}</time> : 'No check-in recorded yet'}</p></div><Link to={`/crew/${encodeURIComponent(member.id)}/checkin`} className="brief-button brief-primary">Start check-in <Icon name="arrow" /></Link></div><p className="brief-summary">{summary}</p></header>
    {storageMessage && <p role="status" className="brief-muted mb-5">{storageMessage}</p>}
    <div className="brief-columns"><div className="brief-stack"><BaselineComparison results={results} observations={observations} now={now} crewId={member.id} /></div><aside className="brief-stack" aria-label="Task and next steps"><TaskCard task={task} now={now} /><DecisionBar decisions={decisions.filter(row => row.crewId === member.id)} onSave={recordDecision} /></aside></div>
    <div role="status" aria-live="polite" aria-atomic="true">{toast && <div className="brief-toast"><Icon name="check" />{toast}</div>}</div>
  </div>;
}

// Compatible with both P1's default and named lazy route loaders.
export { BriefScreen };

export default function BriefScreen() {
  const { crewId } = useParams<{ crewId: string }>();
  const member = crew.find(item => item.id === crewId);
  if (!member) return <section className="brief-dashboard"><h1>Crew member not found</h1><p className="brief-muted mt-3">This link does not match a crew member in the demonstration data.</p><Link to="/" className="brief-link mt-4 inline-block">Choose a crew member</Link></section>;
  return <CrewBrief key={member.id} member={member} />;
}

