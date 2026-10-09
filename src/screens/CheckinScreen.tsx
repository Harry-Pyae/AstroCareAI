import { useI18n } from '../i18n/LanguageProvider';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Observation } from '../lib/types';
import { saveCheckinEntry, SYMPTOMS, type CheckinDetails, type Symptom } from '../lib/storage';
import { useDemo } from '../components/demo/DemoProvider';
import Icon, { type IconName } from '../components/icons/Icon';
import Button, { buttonClass } from '../components/ui/Button';

const inputClass = 'min-h-11 w-full rounded-lg border border-default bg-page px-4 py-2 text-primary aria-invalid:border-danger';

type Errors = Partial<Record<'sleep' | 'sleepQuality' | 'fatigue' | 'exercise' | 'exertion' | 'hydration' | 'mood' | 'stress' | 'symptomOther', string>>;

function FieldError({ id, message }: { id: string; message?: string }) {
  const { t } = useI18n();
  if (!message) return null;
  return <p id={id} className="mt-2 flex items-center gap-1.5 text-sm text-danger"><Icon name="review" size={16} />{t(message)}</p>;
}

function Rating({ name, legend, value, onChange, low, high, error }: { name: string; legend: string; value: number | null; onChange: (v: number) => void; low: string; high: string; error?: string }) {
  const { t } = useI18n();
  return <fieldset aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined}>
    <legend className="mb-3 text-sm font-medium">{t(legend)}</legend>
    <div className="grid grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5].map(n => <label key={n} className="cursor-pointer">
        <input className="peer sr-only" type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} aria-label={t('rating.value', { value: n })} />
        <span className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-default bg-page text-primary hover:border-strong peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:font-semibold peer-checked:text-accent peer-focus-visible:focus-ring">
          {n}{value === n ? <Icon name="check" size={16} /> : null}
        </span>
      </label>)}
    </div>
    <div className="mt-2 flex justify-between gap-4 text-xs text-secondary"><span>{t(low)}</span><span className="text-right">{t(high)}</span></div>
    <FieldError id={`${name}-error`} message={error} />
  </fieldset>;
}

function Group({ icon, title, hint, children }: { icon: IconName; title: string; hint: string; children: ReactNode }) {
  const { t } = useI18n();
  return <section className="rounded-xl border border-default bg-card p-5 sm:p-6">
    <h2 className="flex items-center gap-2 text-lg font-semibold"><Icon name={icon} className="text-secondary" />{t(title)}</h2>
    <p className="mt-1 text-sm text-secondary">{t(hint)}</p>
    <div className="mt-5 space-y-6">{children}</div>
  </section>;
}

export default function CheckinScreen() {
  const { t, date } = useI18n();
  const { crewId } = useParams<{ crewId: string }>();
  const { dataset } = useDemo();
  const member = dataset.crew.find(person => person.id === crewId);
  const [sleep, setSleep] = useState('');
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [exercise, setExercise] = useState('');
  const [exertion, setExertion] = useState<number | null>(null);
  const [hydration, setHydration] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [symptomOther, setSymptomOther] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  if (!member) {
    return <section className="mx-auto max-w-xl rounded-xl border border-default bg-card p-6 text-primary">
      <h1 className="text-xl font-semibold">{t('Crew member not found')}</h1>
      <Link to="/" className={buttonClass('secondary', 'md', 'mt-4')}>{t('Return to crew selection')}</Link>
    </section>;
  }
  const memberId = member.id;
  const briefPath = `/crew/${encodeURIComponent(memberId)}`;

  function toggleSymptom(symptom: Symptom) {
    setSymptoms(current => symptom === 'none' ? (current.includes('none') ? [] : ['none'])
      : current.includes(symptom) ? current.filter(item => item !== symptom) : [...current.filter(item => item !== 'none'), symptom]);
  }

  function validate(): Errors {
    const next: Errors = {};
    const hours = Number(sleep);
    if (!sleep.trim() || !Number.isFinite(hours) || hours < 0 || hours > 24) next.sleep = 'Enter sleep from 0 to 24 hours.';
    if (sleepQuality === null) next.sleepQuality = 'Choose a sleep quality rating.';
    if (fatigue === null) next.fatigue = 'Choose a fatigue rating.';
    const minutes = Number(exercise);
    if (exercise.trim() && (!Number.isFinite(minutes) || minutes < 0 || minutes > 600)) next.exercise = 'Enter exercise from 0 to 600 minutes.';
    else if (exercise.trim() && minutes > 0 && exertion === null) next.exertion = 'Choose how hard the exercise felt.';
    const liters = Number(hydration);
    if (hydration.trim() && (!Number.isFinite(liters) || liters < 0 || liters > 10)) next.hydration = 'Enter water intake from 0 to 10 litres.';
    if (mood === null) next.mood = 'Choose a mood rating.';
    if (stress === null) next.stress = 'Choose a stress rating.';
    if (symptoms.includes('other') && !symptomOther.trim()) next.symptomOther = 'Describe the other symptom, or unselect Other.';
    return next;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || savedAt) return;
    const found = validate();
    setErrors(found);
    setSaveError('');
    if (Object.keys(found).length) {
      document.getElementById(`${Object.keys(found)[0]}-field`)?.focus();
      return;
    }
    setIsSaving(true);
    const timestamp = new Date().toISOString();
    const reading = (metric: Observation['metric'], value: number): Observation => ({ crewId: memberId, metric, value, timestamp, provenance: 'user_checkin' });
    const minutes = exercise.trim() ? Number(exercise) : null;
    const observations = [reading('sleep_hours', Number(sleep)), reading('mood', mood!), ...(minutes !== null ? [reading('exercise_min', minutes)] : [])];
    const details: CheckinDetails = {
      crewId: memberId, timestamp, fatigue: fatigue!, note: note.trim(),
      sleepQuality: sleepQuality!, stress: stress!, symptoms,
      ...(minutes && exertion !== null ? { exertion } : {}),
      ...(symptoms.includes('other') ? { symptomOther: symptomOther.trim().slice(0, 120) } : {}),
      ...(hydration.trim() ? { hydrationLiters: Number(hydration) } : {}),
    };
    const saved = saveCheckinEntry(observations, details);
    setIsSaving(false);
    if (saved) setSavedAt(timestamp);
    else setSaveError('Could not save in this browser. Your entries are still here; enable browser storage and try again.');
  }

  const described = (key: keyof Errors, help?: string) => ({
    id: `${key}-field`,
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': [help, errors[key] ? `${key}-error` : ''].filter(Boolean).join(' ') || undefined,
  });

  return <section className="mx-auto max-w-2xl text-primary">
    <Link to={briefPath} className={buttonClass('ghost', 'sm', '-ml-3')}><Icon name="arrow-left" size={16} />{t('Back to brief')}</Link>
    <header className="mb-6 mt-4">
      <p className="font-mono text-xs uppercase tracking-widest text-secondary">{member.name} · {t(member.role)}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t('Daily check-in')}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-secondary">{t('checkin.intro')}</p>
    </header>

    {savedAt ? <div className="motion-mount rounded-xl border border-default bg-card p-6" role="status" aria-live="polite">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent"><Icon name="check" size={16} />{t('Check-in saved')}</p>
      <h2 className="mt-2 text-xl font-semibold">{t('Your new observation is ready to review')}</h2>
      <p className="mt-2 text-sm text-secondary">{t('checkin.savedSummary', { hours: Number(sleep), time: date(savedAt) })}</p>
      <Link to={briefPath} className={buttonClass('primary', 'md', 'mt-5')}>{t('Return to brief')}<Icon name="arrow" size={18} /></Link>
    </div> : <form onSubmit={submit} noValidate className="space-y-6">
      <Group icon="sleep" title="Rest" hint="checkin.restHint">
        <div>
          <label htmlFor="sleep-field" className="mb-2 block text-sm font-medium">{t('Sleep in the last 24 hours')}</label>
          <div className="flex items-center gap-3">
            <input autoFocus type="number" inputMode="decimal" min="0" max="24" step="any" value={sleep} onChange={e => setSleep(e.target.value)} className={inputClass} {...described('sleep', 'sleep-help')} />
            <span className="text-sm text-secondary">{t('hours')}</span>
          </div>
          <p id="sleep-help" className="mt-2 text-xs text-secondary">{t('Enter a value from 0 to 24.')}</p>
          <FieldError id="sleep-error" message={errors.sleep} />
        </div>
        <Rating name="sleepQuality" legend="How well did you sleep?" value={sleepQuality} onChange={setSleepQuality} low="1 · Poorly" high="5 · Very well" error={errors.sleepQuality} />
        <Rating name="fatigue" legend="How fatigued do you feel?" value={fatigue} onChange={setFatigue} low="1 · Least fatigued" high="5 · Most fatigued" error={errors.fatigue} />
      </Group>

      <Group icon="activity" title="Activity" hint="checkin.activityHint">
        <div>
          <label htmlFor="exercise-field" className="mb-2 block text-sm font-medium">{t('Exercise today')} <span className="text-secondary">{t('(optional)')}</span></label>
          <div className="flex items-center gap-3">
            <input type="number" inputMode="numeric" min="0" max="600" step="1" value={exercise} onChange={e => setExercise(e.target.value)} className={inputClass} {...described('exercise')} />
            <span className="text-sm text-secondary">{t('min')}</span>
          </div>
          <FieldError id="exercise-error" message={errors.exercise} />
        </div>
        {Number(exercise) > 0 && <Rating name="exertion" legend="How hard did the exercise feel?" value={exertion} onChange={setExertion} low="1 · Very light" high="5 · Very hard" error={errors.exertion} />}
        <div>
          <label htmlFor="hydration-field" className="mb-2 block text-sm font-medium">{t('Water intake today')} <span className="text-secondary">{t('(optional)')}</span></label>
          <div className="flex items-center gap-3">
            <input type="number" inputMode="decimal" min="0" max="10" step="0.25" value={hydration} onChange={e => setHydration(e.target.value)} className={inputClass} {...described('hydration', 'hydration-help')} />
            <span className="text-sm text-secondary">{t('litres')}</span>
          </div>
          <p id="hydration-help" className="mt-2 text-xs text-secondary">{t('About 4 glasses per litre. Shown for your record only.')}</p>
          <FieldError id="hydration-error" message={errors.hydration} />
        </div>
      </Group>

      <Group icon="wellbeing" title="Wellbeing" hint="checkin.wellbeingHint">
        <Rating name="mood" legend="How is your mood?" value={mood} onChange={setMood} low="1 · Low" high="5 · Good" error={errors.mood} />
        <Rating name="stress" legend="How stressed do you feel?" value={stress} onChange={setStress} low="1 · Not stressed" high="5 · Very stressed" error={errors.stress} />
        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('Anything you noticed today?')}</legend>
          <p className="mb-3 text-xs text-secondary">{t('Recorded as you describe it, never interpreted.')}</p>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map(symptom => <label key={symptom} className="cursor-pointer">
              <input type="checkbox" className="peer sr-only" checked={symptoms.includes(symptom)} onChange={() => toggleSymptom(symptom)} />
              <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-default bg-page px-4 text-sm text-primary hover:border-strong peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent peer-focus-visible:focus-ring">
                {symptoms.includes(symptom) ? <Icon name="check" size={16} /> : null}{t(`symptom.${symptom}`)}
              </span>
            </label>)}
          </div>
          {symptoms.includes('other') && <div className="mt-3">
            <label htmlFor="symptomOther-field" className="sr-only">{t('Describe the other symptom')}</label>
            <input type="text" maxLength={120} value={symptomOther} onChange={e => setSymptomOther(e.target.value)} placeholder={t('Describe the other symptom')} className={inputClass} {...described('symptomOther')} />
            <FieldError id="symptomOther-error" message={errors.symptomOther} />
          </div>}
        </fieldset>
        <div>
          <label htmlFor="checkin-note" className="mb-2 block text-sm font-medium">{t('Note')} <span className="text-secondary">{t('(optional)')}</span></label>
          <textarea id="checkin-note" rows={3} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} className="w-full rounded-lg border border-default bg-page px-4 py-3 text-primary" />
          <p className="mt-2 text-right text-xs tabular-nums text-secondary">{note.length}/1000</p>
        </div>
      </Group>

      {Object.keys(errors).length > 0 && <p role="alert" className="flex items-center gap-2 rounded-lg border border-danger p-3 text-sm text-danger"><Icon name="review" size={18} />{t('Some answers need attention. Check the highlighted fields.')}</p>}
      {saveError && <p role="alert" className="rounded-lg border border-danger p-3 text-sm text-danger">{t(saveError)}</p>}
      <p className="text-xs text-secondary">{t('checkin.mapping')}</p>
      <Button type="submit" variant="primary" className="w-full" disabled={isSaving}>
        {isSaving ? t('Saving check-in…') : t('Save check-in')}
      </Button>
    </form>}
  </section>;
}
