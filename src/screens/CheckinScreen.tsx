import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import crewData from '../data/crew.json';
import type { CrewMember, Observation } from '../lib/types';
import { saveCheckinEntry } from '../lib/storage';

const crew: CrewMember[] = crewData;

export default function CheckinScreen() {
  const { crewId } = useParams<{ crewId: string }>();
  const navigate = useNavigate();
  const member = crew.find((person) => person.id === crewId);
  const [sleep, setSleep] = useState('');
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  if (!member) return <section><h1>Crew member not found</h1><Link to='/'>Return to crew selection</Link></section>;
  const memberId = member.id;
  const briefPath = `/crew/${encodeURIComponent(memberId)}`;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hours = Number(sleep);
    if (!sleep.trim() || !Number.isFinite(hours) || hours < 0 || hours > 24 || fatigue === null) { setError('Enter sleep from 0 to 24 hours and choose a fatigue rating.'); return; }
    const timestamp = new Date().toISOString();
    const observation: Observation = { crewId: memberId, metric: 'sleep_hours', value: hours, timestamp, provenance: 'user_checkin' };
    const saved = saveCheckinEntry(observation, { crewId: memberId, timestamp, fatigue, note: note.trim() });
    if (saved) navigate(briefPath);
    else setError('Could not save in this browser. Your entries are still here; enable browser storage and try again.');
  }
  return <section className='mx-auto max-w-xl'>
    <Link to={briefPath} className='text-amber-300 underline'>← Back to brief</Link>
    <p className='mt-7 font-mono text-xs uppercase tracking-widest text-neutral-400'>{member.name} · {member.role}</p>
    <h1 className='mt-2 text-3xl text-neutral-100'>30-second check-in</h1>
    <p className='mb-8 mt-3 text-sm text-neutral-400'>Synthetic demonstration data — not medical advice. Sleep joins recent observations; fatigue and notes are saved separately for review.</p>
    <form onSubmit={submit} className='space-y-7'>
      <div><label htmlFor='sleep-hours' className='mb-2 block text-sm'>Sleep in the last 24 hours</label><div className='flex gap-3'><input autoFocus id='sleep-hours' name='sleepHours' type='number' inputMode='decimal' min='0' max='24' step='any' required value={sleep} onChange={e => setSleep(e.target.value)} className='w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3' /><span>hours</span></div></div>
      <fieldset><legend className='mb-3 text-sm'>How fatigued do you feel?</legend><div className='grid grid-cols-5 gap-2'>{[1,2,3,4,5].map(n => <label key={n} className='cursor-pointer'><input className='peer sr-only' type='radio' name='fatigue' value={n} required checked={fatigue===n} onChange={() => setFatigue(n)} aria-label={`${n} of 5`} /><span className='flex min-h-12 items-center justify-center rounded-lg border border-neutral-700 peer-checked:border-amber-400 peer-checked:text-amber-300 peer-focus-visible:outline'>{n}</span></label>)}</div><div className='mt-2 flex justify-between text-xs text-neutral-400'><span>1 · Least fatigued</span><span>5 · Most fatigued</span></div></fieldset>
      <div><label htmlFor='checkin-note' className='mb-2 block text-sm'>Note <span className='text-neutral-400'>(optional)</span></label><textarea id='checkin-note' rows={3} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} className='w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3' /></div>
      {error ? <p role='alert' className='text-sm text-amber-200'>{error}</p> : null}
      <button className='min-h-12 w-full rounded-lg bg-amber-400 px-5 py-3 font-medium text-neutral-950' type='submit'>Save check-in and return to brief</button>
    </form>
  </section>;
}
