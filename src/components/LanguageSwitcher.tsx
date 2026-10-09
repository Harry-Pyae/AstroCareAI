import { useI18n } from '../i18n/LanguageProvider';
export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  return <div role="group" aria-label={t('Website language')} className="language-switch inline-flex h-11 shrink-0 items-center gap-1 rounded-lg border border-default bg-card p-1">
    <button type="button" lang="en" aria-pressed={language === 'en'} aria-label="English" onClick={() => setLanguage('en')} className={`h-9 rounded-md px-3 text-sm transition-colors duration-[var(--dur-fast)] ${language === 'en' ? 'bg-accent text-on-accent font-semibold' : 'text-secondary hover:bg-card-raised hover:text-primary'}`}>EN</button>
    <button type="button" lang="my" aria-pressed={language === 'my'} aria-label="မြန်မာ" onClick={() => setLanguage('my')} className={`h-9 rounded-md px-3 text-sm transition-colors duration-[var(--dur-fast)] ${language === 'my' ? 'bg-accent text-on-accent font-semibold' : 'text-secondary hover:bg-card-raised hover:text-primary'}`}>မြန်မာ</button>
  </div>;
}
