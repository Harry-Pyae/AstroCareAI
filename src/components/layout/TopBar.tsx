import { useMatch, useNavigate } from 'react-router-dom';
import crewData from '../../data/crew.json';
import type { CrewMember } from '../../lib/types';
import { resetAll } from '../../lib/storage';
import { useTheme } from '../../theme';
import { icons } from './Nav';

const crew: CrewMember[] = crewData;

const button =
  'inline-flex min-h-11 items-center gap-2 rounded-lg border border-default px-3 text-sm text-secondary hover:border-strong hover:text-primary';

function resetDemo() {
  resetAll();
  location.reload();
}

export default function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const crewMatch = useMatch('/crew/:crewId/*');
  const onCheckin = useMatch('/crew/:crewId/checkin') !== null;
  const crewId = crewMatch?.params.crewId ?? '';
  const title = !crewMatch ? 'Crew selection' : onCheckin ? 'Check-in' : 'Baseline brief';
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="z-30 flex flex-wrap items-center gap-3 border-b border-default bg-page/95 px-4 py-3 backdrop-blur md:sticky md:top-0 md:px-8">
      <button type="button" onClick={onOpenMenu} aria-label="Open navigation" className={`${button} md:hidden`}>
        {icons.menu}
      </button>
      <p className="text-lg font-semibold text-primary">{title}</p>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {/* P3 replaces this placeholder with the DemoProvider-driven status chip. */}
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-accent-review/40 bg-accent-review/10 px-3 text-xs font-medium text-accent-review">
          <span aria-hidden>◆</span> Synthetic data
        </span>

        <label htmlFor="crew-select" className="sr-only">Crew member</label>
        <select
          id="crew-select"
          value={crewId}
          onChange={(e) => navigate(`/crew/${e.target.value}${onCheckin ? '/checkin' : ''}`)}
          className="min-h-11 max-w-full rounded-lg border border-default bg-card px-3 text-sm text-primary"
        >
          <option value="" disabled>Select crew member</option>
          {crew.map((m) => (
            <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
          ))}
        </select>

        <button type="button" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} theme`} className={button}>
          {theme === 'dark' ? icons.sun : icons.moon}
          <span>{theme === 'dark' ? 'Light' : 'Dark'} theme</span>
        </button>

        {/* Language switch slot: render only if P4 ships complete translations. */}

        <button type="button" onClick={resetDemo} className={button}>Reset demo</button>
      </div>
    </header>
  );
}
