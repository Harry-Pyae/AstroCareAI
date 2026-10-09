import { useI18n } from "../../i18n/LanguageProvider";
import { useMatch, useNavigate } from 'react-router-dom';
import { useTheme } from '../../theme';
import LanguageSwitcher from '../LanguageSwitcher';
import Select from '../ui/Select';
import Icon from '../icons/Icon';
import { useCrew, useDemo } from '../demo/DemoProvider';
import { DemoStatusChip } from '../demo/DemoStatusChip';

const button =
  'inline-flex min-h-11 items-center gap-2 rounded-lg border border-default px-3 text-sm text-secondary hover:border-strong hover:text-primary';

export default function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const crew = useCrew();
  const { active, enter, exit, resetDemo } = useDemo();
  const crewMatch = useMatch('/crew/:crewId/*');
  const onCheckin = useMatch('/crew/:crewId/checkin') !== null;
  const crewId = crewMatch?.params.crewId ?? '';
  const title = !crewMatch ? 'Crew selection' : onCheckin ? 'Check-in' : 'Baseline brief';
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  function handleDemoAction() {
    if (active) resetDemo();
    else {
      enter('reviewing');
      if (!crewMatch) navigate('/crew/ac-cmdr-01');
    }
  }

  return (
    <header className="z-30 flex flex-wrap items-center gap-3 border-b border-default bg-page/95 px-4 py-3 backdrop-blur md:sticky md:top-0 md:px-8">
      <button type="button" onClick={onOpenMenu} aria-label={t("Open navigation")} className={`${button} md:hidden`}>
        <Icon name="menu" />
      </button>
      <p className="text-lg font-semibold text-primary">{t(title)}</p>

      <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center gap-2">
        {active ? <DemoStatusChip /> : <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-default bg-card px-3 text-xs font-medium text-secondary"><Icon name="info" size={16} />{t('Synthetic data')}</span>}

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
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          <span>{t(theme === 'dark' ? 'Light theme' : 'Dark theme')}</span>
        </button>

        <LanguageSwitcher />

        <button type="button" onClick={handleDemoAction} className={button}><Icon name={active ? 'recheck' : 'research'} size={18} />{t(active ? 'Reset demo' : 'Explore demo')}</button>
        {active ? <button type="button" onClick={exit} className={button}><Icon name="close" size={18} />{t('Exit demo')}</button> : null}
      </div>
    </header>
  );
}
