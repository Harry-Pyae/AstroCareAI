import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageProvider';
import { computeBaselines } from '../../lib/baseline';
import { getCheckins } from '../../lib/storage';
import type { BaselineResult } from '../../lib/types';
import { freshness } from '../brief/format';
import ExploreDemoEntry from '../demo/ExploreDemoEntry';
import { useDemo } from '../demo/DemoProvider';
import Icon from '../icons/Icon';

const chip = 'inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium';

/** Counts only, never a score or rating. */
function StatusSummary({ results }: { results: BaselineResult[] }) {
  const { t } = useI18n();
  const reviewing = results.filter(r => r.status === 'worth_reviewing').length;
  const limited = results.filter(r => r.status === 'insufficient_data' || r.status === 'stale_data').length;
  if (!reviewing && !limited) return <span className={`${chip} border-default text-secondary`}><Icon name="check" size={14} />{t('All within personal baseline range')}</span>;
  return <span className="flex flex-wrap gap-2">
    {reviewing > 0 && <span className={`${chip} border-accent-review/40 bg-accent-review/10 text-accent-review`}><Icon name="review" size={14} />{t('crew.reviewing', { count: reviewing })}</span>}
    {limited > 0 && <span className={`${chip} border-default text-secondary`}><Icon name="info" size={14} />{t('crew.limited', { count: limited })}</span>}
  </span>;
}

export default function CrewSelectPage() {
  const { t } = useI18n();
  const { dataset, version } = useDemo();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => setNow(new Date()), [version]);

  const rows = dataset.crew.map(member => {
    const observations = [...dataset.observations, ...getCheckins(member.id)].filter(row => row.crewId === member.id && Date.parse(row.timestamp) <= now.getTime());
    const latest = observations.reduce((max, row) => Math.max(max, Date.parse(row.timestamp)), -Infinity);
    return { member, results: computeBaselines(observations, member.id, now), latest: Number.isFinite(latest) ? new Date(latest).toISOString() : undefined };
  });
  const reviewingCrew = rows.filter(r => r.results.some(x => x.status === 'worth_reviewing')).length;
  const limitedCrew = rows.filter(r => r.results.some(x => x.status === 'insufficient_data' || x.status === 'stale_data')).length;

  return <section className="space-y-8">
    <header>
      <h1 className="text-2xl font-semibold text-primary">{t('Select crew member')}</h1>
      <p className="mt-2 text-secondary">{t('Select a profile to open their personal baseline brief.')}</p>
    </header>

    <ExploreDemoEntry />

    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{t('Crew')}</h2>
        <p className="text-xs text-secondary">{t('crew.overview', { total: rows.length, reviewing: reviewingCrew, limited: limitedCrew })}</p>
      </div>
      <ul className="motion-stagger divide-y divide-default overflow-hidden rounded-xl border border-default bg-card">
        {rows.map(({ member, results, latest }) => <li key={member.id}>
          <Link to={`/crew/${encodeURIComponent(member.id)}`} className="group flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 transition-[background-color] duration-[var(--dur-base)] hover:bg-card-raised sm:flex-nowrap">
            <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent">{member.name.split(' ').map(part => part[0]).join('')}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-primary">{member.name}</span>
              <span className="block text-sm text-secondary">{t(member.role)} · <span className="font-mono text-xs">{member.id}</span></span>
            </span>
            <span className="text-xs text-secondary sm:w-44">{freshness(latest, now, t)}</span>
            <span className="sm:w-64"><StatusSummary results={results} /></span>
            <Icon name="chevron-right" className="hidden text-secondary transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5 sm:block" />
          </Link>
        </li>)}
      </ul>
      <p className="mt-3 text-xs text-secondary">{t('Counts compare each person with their own baseline only. They are not health ratings.')}</p>
    </div>
  </section>;
}
