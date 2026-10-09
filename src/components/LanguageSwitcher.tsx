import { useI18n } from '../i18n/LanguageProvider';
export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  return <div role="group" aria-label={t('Website language')} className="language-switch inline-flex shrink-0 rounded-lg border border-default bg-card p-1">
    <button type="button" lang="en" aria-pressed={language === 'en'} aria-label="English" onClick={() => setLanguage('en')} className={`min-h-11 rounded-md px-3 text-sm ${language === 'en' ? 'bg-accent text-on-accent font-semibold' : 'text-secondary hover:bg-card-raised'}`}>EN</button>
    <button type="button" lang="my" aria-pressed={language === 'my'} aria-label="မြန်မာ" onClick={() => setLanguage('my')} className={`min-h-11 rounded-md px-3 text-sm ${language === 'my' ? 'bg-accent text-on-accent font-semibold' : 'text-secondary hover:bg-card-raised'}`}>မြန်မာ</button>
  </div>;
}
