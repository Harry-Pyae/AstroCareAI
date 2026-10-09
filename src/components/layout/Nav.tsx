import { useI18n } from "../../i18n/LanguageProvider";
import { NavLink, useMatch } from 'react-router-dom';
import Icon from '../icons/Icon';

// Collapsible = sidebar (icons-only ≤1024px). Same paddings and states in both
// sizes; only the label visibility and icon centering change.
const collapseLabel = 'sr-only min-[1025px]:not-sr-only min-[1025px]:[html[data-sidebar=collapsed]_&]:sr-only';
const collapseAlign = 'justify-center min-[1025px]:justify-start min-[1025px]:[html[data-sidebar=collapsed]_&]:justify-center';

export function Brand({ collapsible }: { collapsible: boolean }) {
  return (
    <NavLink to="/" aria-label="ASTROCARE" className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-primary ${collapsible ? collapseAlign : ''}`}>
      <img src="/favicon.svg" alt="" width="28" height="28" className="shrink-0" />
      <span className={`font-mono text-sm font-semibold tracking-[0.2em] ${collapsible ? collapseLabel : ''}`}>
        ASTROCARE
      </span>
    </NavLink>
  );
}

/** Existing destinations only. Brief/Check-in appear once a crew member is selected. */
export function NavList({ collapsible }: { collapsible: boolean }) {
  const { t } = useI18n();
  const crewId = useMatch('/crew/:crewId/*')?.params.crewId;
  const items = [
    { to: '/', label: 'Crew', icon: 'crew' },
    ...(crewId
      ? [
          { to: `/crew/${crewId}`, label: 'Baseline brief', icon: 'brief' },
          { to: `/crew/${crewId}/checkin`, label: 'Check-in', icon: 'checkin' },
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
            title={t(item.label)}
            aria-label={t(item.label)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-[color,background-color,border-color,opacity,transform] duration-[var(--dur-base)] ${collapsible ? collapseAlign : ''} ${
                isActive
                  ? 'bg-accent/15 font-semibold text-accent'
                  : 'text-secondary hover:bg-card-raised hover:text-primary'
              }`
            }
          >
            <Icon name={item.icon as 'crew' | 'brief' | 'checkin'} />
            <span className={collapsible ? collapseLabel : ''}>{t(item.label)}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
