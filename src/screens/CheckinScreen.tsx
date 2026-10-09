import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import crewData from '../data/crew.json';
import type { CrewMember, Observation } from '../lib/types';
import { saveCheckinEntry } from '../lib/storage';

const crew: CrewMember[] = crewData;

export default function CheckinScreen() {
  const { crewId } = useParams<{ crewId: string }>();
  const member = crew.find((person) => person.id === crewId);
  const [sleep, setSleep] = useState('');
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const parsedSleep = Number(sleep);
  const sleepIsInvalid = Boolean(error && (!sleep.trim() || !Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 24));
  const fatigueIsInvalid = Boolean(error && fatigue === null);

  if (!member) {
    return <section className="mx-auto max-w-xl rounded-xl border border-default bg-card p-6 text-primary">
      <h1 className="text-xl font-semibold">Crew member not found</h1>
      <Link to="/" className="mt-4 inline-block min-h-11 text-accent underline underline-offset-4 focus-ring">Return to crew selection</Link>
    </section>;
  }

  const briefPath = `/crew/${encodeURIComponent(member.id)}`;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || savedAt) return;
    const hours = Number(sleep);
    if (!sleep.trim() || !Number.isFinite(hours) || hours < 0 || hours > 24 || fatigue === null) {
      setError('Enter sleep from 0 to 24 hours and choose a fatigue rating.');
      return;
    }

    setError('');
    setIsSaving(true);
    const timestamp = new Date().toISOString();
    const observation: Observation = { crewId: member.id, metric: 'sleep_hours', value: hours, timestamp, provenance: 'user_checkin' };
    const saved = saveCheckinEntry(observation, { crewId: member.id, timestamp, fatigue, note: note.trim() });
    setIsSaving(false);
    if (saved) setSavedAt(timestamp);
    else setError('Could not save in this browser. Your entries are still here; enable browser storage and try again.');
  }

  return <section className="mx-auto max-w-2xl text-primary">
    <Link to={briefPath} className="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4 focus-ring">← Back to brief</Link>
    <header className="mb-8 mt-5">
      <p className="font-mono text-xs uppercase tracking-widest text-secondary">{member.name} · {member.role}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">30-second check-in</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-secondary">Record recent sleep and a fatigue rating. Fatigue and notes stay on this device and do not affect the baseline comparison.</p>
    </header>

    {savedAt ? <div className="rounded-xl border border-default bg-card p-6" role="status" aria-live="polite">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">✓ Check-in saved</p>
      <h2 className="mt-2 text-xl font-semibold">Your new observation is ready to review</h2>
      <p className="mt-2 text-sm text-secondary">Sleep: {Number(sleep)} hours · saved {new Date(savedAt).toLocaleTimeString()}</p>
      <Link to={briefPath} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 py-2 font-medium text-primary focus-ring">Return to brief</Link>
    </div> : <form onSubmit={submit} noValidate className="space-y-6 rounded-xl border border-default bg-card p-5 sm:p-6">
      <div>
        <label htmlFor="sleep-hours" className="mb-2 block text-sm font-medium">Sleep in the last 24 hours</label>
        <div className="flex items-center gap-3">
          <input autoFocus id="sleep-hours" name="sleepHours" type="number" inputMode="decimal" min="0" max="24" step="any" required value={sleep} onChange={event => setSleep(event.target.value)} aria-invalid={sleepIsInvalid} aria-describedby={sleepIsInvalid ? 'sleep-help checkin-error' : 'sleep-help'} className="min-h-11 w-full rounded-lg border border-default bg-page px-4 py-2 text-primary focus-ring" />
          <span className="text-sm text-secondary">hours</span>
        </div>
        <p id="sleep-help" className="mt-2 text-xs text-secondary">Enter a value from 0 to 24.</p>
      </div>

      <fieldset aria-invalid={fatigueIsInvalid} aria-describedby={fatigueIsInvalid ? 'checkin-error' : undefined}>
        <legend className="mb-3 text-sm font-medium">How fatigued do you feel?</legend>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(value => <label key={value} className="cursor-pointer">
            <input className="peer sr-only" type="radio" name="fatigue" value={value} required checked={fatigue === value} onChange={() => setFatigue(value)} aria-label={`${value} of 5`} />
            <span className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-default bg-page text-primary peer-checked:border-accent-review peer-checked:text-accent-review peer-focus-visible:focus-ring">{value}{fatigue === value ? <span aria-hidden="true">✓</span> : null}</span>
          </label>)}
        </div>
        <div className="mt-2 flex justify-between text-xs text-secondary"><span>1 · Least fatigued</span><span>5 · Most fatigued</span></div>
      </fieldset>

      <div>
        <label htmlFor="checkin-note" className="mb-2 block text-sm font-medium">Note <span className="text-secondary">(optional)</span></label>
        <textarea id="checkin-note" rows={4} maxLength={1000} value={note} onChange={event => setNote(event.target.value)} className="w-full rounded-lg border border-default bg-page px-4 py-3 text-primary focus-ring" />
        <p className="mt-2 text-right text-xs text-secondary">{note.length}/1000</p>
      </div>

      {error ? <p id="checkin-error" role="alert" className="rounded-lg border border-accent-review bg-card p-3 text-sm text-accent-review">{error}</p> : null}
      <button className="min-h-11 w-full rounded-lg bg-accent px-5 py-3 font-medium text-primary focus-ring disabled:cursor-wait disabled:opacity-70" type="submit" disabled={isSaving}>
        {isSaving ? 'Saving check-in…' : 'Save check-in'}
      </button>
    </form>}
  </section>;
}
