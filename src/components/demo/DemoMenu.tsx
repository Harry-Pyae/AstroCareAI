import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/LanguageProvider';
import { SCENARIOS, SCENARIO_IDS, type ScenarioId } from '../../data/scenarios';
import Icon from '../icons/Icon';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useDemo } from './DemoProvider';
import { useDemoGuide } from './DemoGuide';

const chip = 'inline-flex h-11 items-center gap-1.5 rounded-full border border-accent-review/40 bg-accent-review/10 px-3 text-xs font-medium text-accent-review';

/** Top-bar demo status. Off: a static synthetic-data label. On: a button that
 * opens the demo control panel (scenario, reset, guide, exit). */
export default function DemoMenu() {
  const { t } = useI18n();
  const { active, scenario, revision, storageMessage, setScenario, resetDemo, exit } = useDemo();
  const openGuide = useDemoGuide();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { setConfirmReset(false); }, [active, scenario, revision]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      // A nested Select handles its own Escape first.
      if (e.key === 'Escape' && !e.defaultPrevented) { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  useEffect(() => {
    if (!confirmReset) return;
    const timeout = window.setTimeout(() => setConfirmReset(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [confirmReset]);

  if (!active) {
    return <span className={chip}><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-review" />{t('Synthetic data')}</span>;
  }

  function reset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    const saved = resetDemo();
    setConfirmReset(false);
    setNotice(saved ? 'Demo restored to the start of this scenario.' : '');
  }

  return <div ref={rootRef} className="relative">
    <button ref={triggerRef} type="button" aria-expanded={open} aria-controls="demo-panel" onClick={() => { setOpen(!open); setNotice(''); }} className={`${chip} transition-[color,background-color,border-color,opacity,transform] duration-[var(--dur-fast)] hover:bg-accent-review/20`}>
      <Icon name="play" size={14} />{t('Demo')} · {t(SCENARIOS[scenario].label)}<Icon name="chevron-down" size={14} />
    </button>
    {open && <div id="demo-panel" role="dialog" aria-label={t('Demo controls')} className="motion-popover absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-default bg-card p-5 text-primary shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{t('Demo controls')}</h2>
        <span className="rounded-full border border-accent-review/40 bg-accent-review/10 px-3 py-1 text-xs font-medium text-accent-review">{t('Synthetic data')}</span>
      </div>
      <p className="mt-1 text-xs text-secondary">{t('Demo records are kept separate from your own check-ins.')}</p>
      <div className="mt-5">
        <p id="scenario-label" className="mb-2 text-sm font-medium">{t('Scenario')}</p>
        <Select id="scenario-select" label={t('Scenario')} value={scenario} className="w-full"
          options={SCENARIO_IDS.map(id => ({ value: id, label: t(SCENARIOS[id].label) }))}
          onChange={id => { setNotice(setScenario(id as ScenarioId) ? 'Scenario loaded. All screens now show its data.' : ''); }} />
        <p className="mt-2 text-xs text-secondary" aria-live="polite">{t(SCENARIOS[scenario].description)}</p>
      </div>
      <div className="mt-5 grid gap-2">
        <Button variant="secondary" onClick={reset}><Icon name="recheck" size={18} />{t(confirmReset ? 'Select again to confirm reset' : 'Reset this scenario')}</Button>
        <Button variant="secondary" onClick={() => { setOpen(false); openGuide(); }}><Icon name="help" size={18} />{t('How this demo works')}</Button>
        <Button variant="ghost" onClick={() => { if (exit()) setOpen(false); }}><Icon name="exit" size={18} />{t('Exit demo')}</Button>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-xs text-accent">{notice ? t(notice) : ''}</p>
      {storageMessage && <p role="alert" className="mt-3 text-xs text-accent-review">{t(storageMessage)}</p>}
    </div>}
  </div>;
}
