import { useState, useEffect } from 'react';
import { useDemo } from './DemoProvider';
import { SCENARIOS } from '../../data/scenarios';
import type { ScenarioId } from '../../data/scenarios';
import { useI18n } from '../../i18n/LanguageProvider';
import Select from '../ui/Select';
import Icon from '../icons/Icon';

export function DemoControlPanel() {
  const { t } = useI18n();
  const { active, scenario, revision, setScenario, resetDemo, exit, storageMessage } = useDemo();
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => { setConfirmReset(false); }, [active, scenario, revision]);
  useEffect(() => {
    if (!confirmReset) return;
    const timeout = window.setTimeout(() => setConfirmReset(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [confirmReset]);
  if (!active) return null;
  return <section className="mx-4 mb-6 rounded-xl border border-default bg-card p-5 text-primary md:mx-8 md:ml-24 min-[1025px]:ml-64 motion-mount" aria-label={t('Demo Control')}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-lg font-semibold">{t('Demo Control')}</h2><p className="mt-1 flex items-center gap-2 text-sm text-accent-review"><Icon name="info" size={18} />{t('Demo — Synthetic Data')}</p></div>
      <button type="button" onClick={exit} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-default px-3 text-sm text-secondary focus-ring hover:text-primary"><Icon name="close" size={18} />{t('Exit Demo Mode')}</button>
    </div>
    <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div><Select id="scenario-select" label={t('Scenario')} value={scenario} options={Object.values(SCENARIOS).map(item => ({ value: item.id, label: t(item.name) }))} onChange={id => setScenario(id as ScenarioId)} /><p className="mt-3 text-sm leading-6 text-secondary" aria-live="polite">{t(SCENARIOS[scenario].description)}</p></div>
      <button type="button" onClick={() => confirmReset ? resetDemo() : setConfirmReset(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-default bg-card px-4 text-sm text-secondary focus-ring hover:text-primary" aria-live="polite"><Icon name="recheck" size={18} />{t(confirmReset ? 'Click to confirm reset' : 'Reset demo data')}</button>
    </div>
    {storageMessage && <p role="alert" className="mt-4 text-sm text-accent-review">{t(storageMessage)}</p>}
  </section>;
}
