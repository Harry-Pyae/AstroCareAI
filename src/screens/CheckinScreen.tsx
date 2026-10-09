import { useI18n } from "../i18n/LanguageProvider";
import { useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CrewMember, Observation } from '../lib/types';
import { CHECKIN_DUPLICATE_WINDOW_MINUTES, saveCheckinEntryResult } from '../lib/storage';
import { useCrew, useDemo } from '../components/demo/DemoProvider';
import Icon from '../components/icons/Icon';

function CrewCheckin({ member }: { member: CrewMember }) {
  const { t, date } = useI18n();
  const [sleep, setSleep] = useState('');
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const submissionInProgress = useRef(false);
  const parsedSleep = Number(sleep);
  const sleepIsInvalid = attempted && (!sleep.trim() || !Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 24);
  const fatigueIsInvalid = attempted && fatigue === null;

  const memberId = member.id;
  const briefPath = `/crew/${encodeURIComponent(memberId)}`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current || savedAt) return;
    setAttempted(true);
    const hours = Number(sleep);
    if (!sleep.trim() || !Number.isFinite(hours) || hours < 0 || hours > 24 || fatigue === null) {
      return;
    }

    submissionInProgress.current = true;
    setSaveError('');
    setIsSaving(true);
    try {
      // Yield once so the disabled/saving state is visible before the write.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const timestamp = new Date().toISOString();
      const observation: Observation = { crewId: memberId, metric: 'sleep_hours', value: hours, timestamp, provenance: 'user_checkin' };
      const result = saveCheckinEntryResult(observation, { crewId: memberId, timestamp, fatigue, note: note.trim() });
      if (result === 'saved') setSavedAt(timestamp);
      else if (result === 'duplicate') setSaveError('checkin.duplicate');
      else setSaveError('Could not save in this browser. Your entries are still here; enable browser storage and try again.');
    } finally {
      submissionInProgress.current = false;
      setIsSaving(false);
    }
  }

  return <section className="mx-auto max-w-2xl text-primary">
    <Link to={briefPath} className="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4 focus-ring">{t("← Back to brief")}</Link>
    <header className="mb-8 mt-5">
      <p className="font-mono text-xs uppercase tracking-widest text-secondary">{member.name} · {t(member.role)}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("30-second check-in")}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-secondary">{t("Record recent sleep and a fatigue rating. Fatigue and notes stay on this device and do not affect the baseline comparison.")}</p>
    </header>

    {savedAt ? <div className="rounded-xl border border-default bg-card p-6" role="status" aria-live="polite">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent"><Icon name="check" size={18} />{t('Check-in saved')}</p>
      <h2 className="mt-2 text-xl font-semibold">{t("Your new observation is ready to review")}</h2>
      <p className="mt-2 text-sm text-secondary">{t('checkin.savedSummary', { hours: Number(sleep), time: date(savedAt) })}</p>
      <Link to={briefPath} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 py-2 font-medium text-on-accent focus-ring">{t("Return to brief")}</Link>
    </div> : <form onSubmit={submit} noValidate className="space-y-6 rounded-xl border border-default bg-card p-5 sm:p-6">
      <div>
        <label htmlFor="sleep-hours" className="mb-2 block text-sm font-medium">{t("Sleep in the last 24 hours")}</label>
        <div className="flex items-center gap-3">
          <input autoFocus id="sleep-hours" name="sleepHours" type="number" inputMode="decimal" min="0" max="24" step="any" required value={sleep} onChange={event => setSleep(event.target.value)} aria-invalid={sleepIsInvalid} aria-describedby={sleepIsInvalid ? 'sleep-help sleep-error' : 'sleep-help'} className="min-h-11 min-w-0 w-full rounded-lg border border-default bg-page px-4 py-2 text-primary focus-ring" />
          <span className="text-sm text-secondary">{t("hours")}</span>
        </div>
        <p id="sleep-help" className="mt-2 text-xs text-secondary">{t("Enter a value from 0 to 24.")}</p>
        {sleepIsInvalid ? <p id="sleep-error" role="alert" className="mt-2 text-sm text-danger">{t(sleep.trim() ? 'checkin.sleepRange' : 'checkin.sleepRequired')}</p> : null}
      </div>

      <fieldset aria-invalid={fatigueIsInvalid} aria-describedby={fatigueIsInvalid ? 'fatigue-error' : undefined}>
        <legend className="mb-3 text-sm font-medium">{t("How fatigued do you feel?")}</legend>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(value => <label key={value} className="cursor-pointer">
            <input className="peer sr-only" type="radio" name="fatigue" value={value} required checked={fatigue === value} onChange={() => setFatigue(value)} aria-label={t('fatigue.rating', { value })} />
            <span className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-default bg-page text-primary peer-checked:border-accent-review peer-checked:text-accent-review peer-focus-visible:focus-ring">{value}{fatigue === value ? <Icon name="check" size={16} /> : null}</span>
          </label>)}
        </div>
        <div className="mt-2 flex justify-between text-xs text-secondary"><span>{t("1 · Least fatigued")}</span><span>{t("5 · Most fatigued")}</span></div>
      </fieldset>

      <div>
        <label htmlFor="checkin-note" className="mb-2 block text-sm font-medium">{t("Note")} <span className="text-secondary">{t("(optional)")}</span></label>
        <textarea id="checkin-note" rows={4} maxLength={1000} value={note} onChange={event => setNote(event.target.value)} className="w-full rounded-lg border border-default bg-page px-4 py-3 text-primary focus-ring" />
        <p className="mt-2 text-right text-xs text-secondary">{note.length}/1000</p>
      </div>

      {fatigueIsInvalid ? <p id="fatigue-error" role="alert" className="text-sm text-danger">{t('checkin.fatigueRequired')}</p> : null}
      {saveError ? <p id="checkin-error" role="alert" className="rounded-lg border border-default bg-page p-3 text-sm text-danger">{t(saveError, { minutes: CHECKIN_DUPLICATE_WINDOW_MINUTES })}</p> : null}
      <button className="min-h-11 w-full rounded-lg bg-accent px-5 py-3 font-medium text-on-accent focus-ring disabled:cursor-wait disabled:opacity-70" type="submit" disabled={isSaving}>
        {isSaving ? t("Saving check-in\u2026") : t("Save check-in")}
      </button>
    </form>}
  </section>;
}

export default function CheckinScreen() {
  const { t } = useI18n();
  const { crewId } = useParams<{ crewId: string }>();
  const crew = useCrew();
  const { active, scenario, revision } = useDemo();
  const member = crew.find(person => person.id === crewId);
  if (!member) return <section className="mx-auto max-w-xl rounded-xl border border-default bg-card p-6 text-primary">
    <h1 className="text-xl font-semibold">{t('Crew member not found')}</h1>
    <Link to="/" className="mt-4 inline-block min-h-11 text-accent underline underline-offset-4 focus-ring">{t('Return to crew selection')}</Link>
  </section>;
  // A different crew or scenario starts a clean form; records remain in their scoped store.
  return <CrewCheckin key={`${member.id}:${active}:${scenario}:${revision}`} member={member} />;
}

