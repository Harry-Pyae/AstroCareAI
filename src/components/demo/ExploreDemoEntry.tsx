import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageProvider';
import Icon from '../icons/Icon';
import Button from '../ui/Button';
import { useDemo } from './DemoProvider';
import { useDemoGuide } from './DemoGuide';

/** Crew-page entry: starts demo mode in "Change worth reviewing" and opens
 * the commander's brief — the strongest first impression, no sign-up. */
export default function ExploreDemoEntry() {
  const { t } = useI18n();
  const { active, enter, dataset, storageMessage } = useDemo();
  const openGuide = useDemoGuide();
  const navigate = useNavigate();
  const star = dataset.crew[0]?.id ?? 'ac-cmdr-01';

  return <section className="rounded-xl border border-accent/40 bg-accent/5 p-5 sm:p-6" aria-labelledby="explore-heading">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="max-w-xl">
        <h2 id="explore-heading" className="flex items-center gap-2 text-lg font-semibold"><Icon name="play" size={18} className="text-accent" />{t(active ? 'Demo mode is on' : 'Explore the judge demo')}</h2>
        <p className="mt-1 text-sm text-secondary">{t(active ? 'Use the Demo button in the top bar to switch scenarios or reset.' : 'Three ready-made scenarios with synthetic data. No sign-up, and your own records are not affected.')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={openGuide}><Icon name="help" size={18} />{t('How this demo works')}</Button>
        {!active && <Button variant="primary" onClick={() => { if (enter('reviewing')) navigate(`/crew/${star}`); }}>{t('Explore demo')}<Icon name="arrow" size={18} /></Button>}
      </div>
    </div>
    {storageMessage && <p role="alert" className="mt-4 text-sm text-accent-review">{t(storageMessage)}</p>}
  </section>;
}
export { ExploreDemoEntry };
