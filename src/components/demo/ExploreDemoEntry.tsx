import { useDemo } from './DemoProvider';
import { useI18n } from '../../i18n/LanguageProvider';
import { ExploreDemoButton } from './ExploreDemoButton';

export function ExploreDemoEntry() {
  const { active, storageMessage } = useDemo();
  const { t } = useI18n();
  if (active) return null;
  return <section className="mt-8 rounded-xl border border-default bg-card p-6 text-center motion-mount">
    <h2 className="mb-2 text-lg font-semibold text-primary">{t('Try the Judge Demo')}</h2>
    <p className="mb-6 text-sm leading-6 text-secondary">{t('Explore interactive scenarios with synthetic data. No real records will be affected.')}</p>
    <ExploreDemoButton />
    {storageMessage && <p role="alert" className="mt-4 text-sm text-accent-review">{t(storageMessage)}</p>}
  </section>;
}
