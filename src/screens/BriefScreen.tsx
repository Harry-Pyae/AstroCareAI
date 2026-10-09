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
import { formatTime } from '../components/brief/format';

const crew = crewData as CrewMember[];
const telemetry = observationData as Observation[];
const tasks = taskData as TaskContext[];

function CrewBrief({ member }: { member: CrewMember }) {
  const [now, setNow] = useState(() => new Date());
  const [checkins, setCheckins] = useState<Observation[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [storageMessage, setStorageMessage] = useState('');
  useEffect(() => {
    const refresh = () => {
      setNow(new Date());
      try {
        setCheckins(getCheckins(member.id));
        setDecisions(getDecisions(member.id));
        setStorageMessage('');
      } catch {
        setStorageMessage('Local history is unavailable. Showing synthetic telemetry; browser storage access is needed for saved check-ins and decisions.');
      }
    };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(interval); window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); };
  }, [member.id]);
  const observations = [...telemetry, ...checkins].filter(row => row.crewId === member.id);
  const results = computeBaselines(observations, member.id, now);
  const lastCheckin = checkins.filter(row => row.crewId === member.id && Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) <= now.getTime()).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]?.timestamp;
  const task = tasks.filter(item => item.crewId === member.id && Date.parse(item.scheduledFor) >= now.getTime()).sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor))[0];
  function recordDecision(action: Decision['action'], note: string) {
    const decision: Decision = { crewId: member.id, action, note, timestamp: new Date().toISOString() };
    if (saveDecision(decision) === false) throw new Error('Decision storage unavailable');
    setDecisions(getDecisions(member.id));
  }
  return <div className="space-y-6">
    <header><Link to="/" className="text-xs text-neutral-400 underline underline-offset-4 hover:text-neutral-200">← All crew</Link><div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-widest text-amber-300">Personal baseline brief</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-100">{member.name}</h1><p className="mt-1 text-sm text-neutral-400">{member.role} · <span className="font-mono">{member.id}</span></p></div><Link to={`/crew/${encodeURIComponent(member.id)}/checkin`} className="rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 hover:border-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400">Add check-in →</Link></div><p className="mt-4 text-xs text-neutral-400">Last check-in: {lastCheckin ? <time dateTime={lastCheckin}>{formatTime(lastCheckin)}</time> : 'No check-in recorded yet'}</p></header>
    {storageMessage && <p role="status" className="rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-sm text-neutral-300">{storageMessage}</p>}
    <BaselineComparison results={results} observations={observations} now={now} />
    <TaskCard task={task} now={now} />
    <DecisionBar decisions={decisions.filter(row => row.crewId === member.id)} onSave={recordDecision} />
  </div>;
}

export default function BriefScreen() {
  const { crewId } = useParams<{ crewId: string }>();
  const member = crew.find(item => item.id === crewId);
  if (!member) return <section className="rounded-xl border border-neutral-800 p-6"><h1 className="text-xl text-neutral-100">Crew member not found</h1><p className="mt-2 text-sm text-neutral-400">This link does not match a crew member in the demonstration data.</p><Link to="/" className="mt-4 inline-block text-sm text-amber-200 underline underline-offset-4">Choose a crew member</Link></section>;
  return <CrewBrief key={member.id} member={member} />;
}
