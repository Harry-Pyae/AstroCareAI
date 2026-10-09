import { NavLink, useMatch } from 'react-router-dom';

const svg = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export const icons = {
  crew: <svg {...svg}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></svg>,
  brief: <svg {...svg}><path d="M3 12h4l3-7 4 14 3-7h4" /></svg>,
  checkin: <svg {...svg}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>,
  menu: <svg {...svg}><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  close: <svg {...svg}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  sun: <svg {...svg}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  moon: <svg {...svg}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>,
};

const collapseLabel = 'sr-only min-[1025px]:not-sr-only';

export function Brand({ collapsible }: { collapsible: boolean }) {
  return (
    <NavLink to="/" className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-primary">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="shrink-0 text-accent">
        <circle cx="14" cy="14" r="5" fill="currentColor" />
        <ellipse cx="14" cy="14" rx="12" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-25 14 14)" />
      </svg>
      <span className={`font-mono text-sm font-semibold tracking-[0.2em] ${collapsible ? collapseLabel : ''}`}>
        ASTROCARE
      </span>
    </NavLink>
  );
}

/** Existing destinations only. Brief/Check-in appear once a crew member is selected. */
export function NavList({ collapsible }: { collapsible: boolean }) {
  const crewId = useMatch('/crew/:crewId/*')?.params.crewId;
  const items = [
    { to: '/', label: 'Crew', icon: icons.crew },
    ...(crewId
      ? [
          { to: `/crew/${crewId}`, label: 'Baseline brief', icon: icons.brief },
          { to: `/crew/${crewId}/checkin`, label: 'Check-in', icon: icons.checkin },
        ]
      : []),
  ];

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end
            title={item.label}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${
                isActive
                  ? 'bg-accent/15 font-semibold text-accent'
                  : 'text-secondary hover:bg-card-raised hover:text-primary'
              }`
            }
          >
            {item.icon}
            <span className={collapsible ? collapseLabel : ''}>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
