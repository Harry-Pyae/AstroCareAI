import { useI18n } from "../../i18n/LanguageProvider";
import { useMatch, useNavigate } from 'react-router-dom';
import crewData from '../../data/crew.json';
import type { CrewMember } from '../../lib/types';
import { resetAll } from '../../lib/storage';
import { useTheme } from '../../theme';
import { icons } from './Nav';
import LanguageSwitcher from '../LanguageSwitcher';
import Select from '../ui/Select';

const crew: CrewMember[] = crewData;

const button =
  'inline-flex min-h-11 items-center gap-2 rounded-lg border border-default px-3 text-sm text-secondary hover:border-strong hover:text-primary';

function resetDemo() {
  resetAll();
  location.reload();
}

export default function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const crewMatch = useMatch('/crew/:crewId/*');
  const onCheckin = useMatch('/crew/:crewId/checkin') !== null;
  const crewId = crewMatch?.params.crewId ?? '';
  const title = !crewMatch ? 'Crew selection' : onCheckin ? 'Check-in' : 'Baseline brief';
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="z-30 flex flex-wrap items-center gap-3 border-b border-default bg-page/95 px-4 py-3 backdrop-blur md:sticky md:top-0 md:px-8">
      <button type="button" onClick={onOpenMenu} aria-label={t("Open navigation")} className={`${button} md:hidden`}>
        {icons.menu}
      </button>
      <p className="text-lg font-semibold text-primary">{t(title)}</p>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {/* P3 replaces this placeholder with the DemoProvider-driven status chip. */}
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-accent-review/40 bg-accent-review/10 px-3 text-xs font-medium text-accent-review">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-review" /> {t('Synthetic data')}
        </span>

        <Select
          id="crew-select"
          label={t('Crew member')}
          placeholder={t('Select crew member')}
          value={crewId}
          options={crew.map((m) => ({ value: m.id, label: `${m.name} — ${t(m.role)}` }))}
          onChange={(id) => navigate(`/crew/${id}${onCheckin ? '/checkin' : ''}`)}
          className="max-w-full"
        />

        <button type="button" onClick={toggleTheme} aria-label={t(nextTheme === 'light' ? 'Switch to light theme' : 'Switch to dark theme')} className={button}>
          {theme === 'dark' ? icons.sun : icons.moon}
          <span>{t(theme === 'dark' ? 'Light theme' : 'Dark theme')}</span>
        </button>

        <LanguageSwitcher />

        <button type="button" onClick={resetDemo} className={button}>{t("Reset demo")}</button>
      </div>
    </header>
  );
}
