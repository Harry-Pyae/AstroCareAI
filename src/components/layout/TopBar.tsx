import { useI18n } from "../../i18n/LanguageProvider";
import { useMatch, useNavigate } from 'react-router-dom';
import { useTheme } from '../../theme';
import Icon from '../icons/Icon';
import LanguageSwitcher from '../LanguageSwitcher';
import Select from '../ui/Select';
import DemoMenu from '../demo/DemoMenu';
import { useDemo } from '../demo/DemoProvider';

const button =
  'inline-flex min-h-11 items-center gap-2 rounded-lg border border-default bg-card px-3 text-sm text-secondary transition-[color,background-color,border-color,opacity,transform] duration-[var(--dur-fast)] hover:border-strong hover:bg-card-raised hover:text-primary';

export default function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useI18n();
  const { dataset, active: demoActive, enter, storageMessage } = useDemo();
  const crew = dataset.crew;
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const crewMatch = useMatch('/crew/:crewId/*');
  const onCheckin = useMatch('/crew/:crewId/checkin') !== null;
  const crewId = crewMatch?.params.crewId ?? '';
  const title = !crewMatch ? 'Crew selection' : onCheckin ? 'Check-in' : 'Baseline brief';
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  function exploreDemo() {
    if (enter('reviewing') && !crewMatch) navigate('/crew/ac-cmdr-01');
  }

  return (
    <header className="z-30 flex flex-wrap items-center gap-3 border-b border-default bg-page/95 px-4 py-3 backdrop-blur md:sticky md:top-0 md:px-8">
      <button type="button" onClick={onOpenMenu} aria-label={t("Open navigation")} className={`${button} md:hidden`}>
        <Icon name="menu" />
      </button>
      <p className="text-lg font-semibold text-primary">{t(title)}</p>

      <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center gap-2">
        <DemoMenu />

        <Select
          id="crew-select"
          label={t('Crew member')}
          placeholder={t('Select crew member')}
          value={crewId}
          options={crew.map((m) => ({ value: m.id, label: `${m.name} — ${t(m.role)}` }))}
          onChange={(id) => navigate(`/crew/${id}${onCheckin ? '/checkin' : ''}`)}
          className="min-w-0 max-w-full"
        />

        <button type="button" onClick={toggleTheme} aria-label={t(nextTheme === 'light' ? 'Switch to light theme' : 'Switch to dark theme')} className={button}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          <span>{t(theme === 'dark' ? 'Light theme' : 'Dark theme')}</span>
        </button>

        <LanguageSwitcher />

        {/* In demo mode, Reset lives in the Demo panel (scenario-aware). */}
        {!demoActive && <button type="button" onClick={exploreDemo} className={button}><Icon name="play" size={18} />{t('Explore demo')}</button>}
      </div>
      {storageMessage ? <p role="alert" className="w-full text-xs text-secondary">{t(storageMessage)}</p> : null}
    </header>
  );
}
