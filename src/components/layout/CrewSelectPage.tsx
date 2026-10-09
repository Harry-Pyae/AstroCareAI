import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageProvider';
import crewData from '../../data/crew.json';
import observationData from '../../data/observations.json';
import type { CrewMember, Observation } from '../../lib/types';
import CrewQR from '../qr/CrewQR';
import Icon from '../icons/Icon';

const crew: CrewMember[] = crewData;
const observations: Observation[] = observationData as Observation[];

/**
 * Summarizes the tracked baseline metrics for a crew member.
 */
function getCrewMetricSummary(crewId: string) {
  const memberObs = observations.filter((o) => o.crewId === crewId);
  const metricSet = new Set(memberObs.map((o) => o.metric));
  return {
    count: metricSet.size || 5,
    totalReadings: memberObs.length,
  };
}

export default function CrewSelectPage() {
  const { t } = useI18n();

  return (
    <section className="space-y-8" aria-labelledby="crew-select-heading">
      {/* Page Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent">
          <Icon name="crew" size={16} />
          <span>{t("ASTROCARE · Crew Access")}</span>
        </div>
        <h1
          id="crew-select-heading"
          className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl"
        >
          {t("Select crew member")}
        </h1>
        <p className="text-base text-secondary">
          {t("Select your profile to open your personal baseline brief")}
        </p>
      </header>

      {/* P3 DEMO INTEGRATION SLOT: P3 mounts <ExploreDemoButton /> here */}
      <div
        id="p3-demo-slot"
        className="flex flex-col items-start justify-between gap-4 rounded-xl border border-default bg-card p-5 sm:flex-row sm:items-center"
      >
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Icon name="schedule" size={20} />
          </span>
          <div>
            <h2 className="text-sm font-medium text-primary">
              {t("Demonstration Walkthrough")}
            </h2>
            <p className="text-xs text-secondary">
              {t("Explore pre-configured astronaut scenarios with personal baseline deviations.")}
            </p>
          </div>
        </div>

        {/* P3 Explore Demo Button Mount Hook */}
        <div id="p3-explore-demo-mount" className="w-full sm:w-auto">
          <Link
            to="/crew/ac-cmdr-01"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition-all duration-[var(--dur-fast,150ms)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-focus-ring sm:w-auto"
          >
            <Icon name="arrow" size={16} />
            <span>{t("Explore demo")}</span>
          </Link>
        </div>
      </div>

      {/* Crew Badge Cards Grid - 24px gap (gap-6) & responsive 390px stacking */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {crew.map((member) => {
          const { count, totalReadings } = getCrewMetricSummary(member.id);

          return (
            <Link
              key={member.id}
              to={`/crew/${member.id}`}
              className="group flex flex-col justify-between rounded-xl border border-default bg-card p-6 transition-all duration-[var(--dur-fast,150ms)] hover:-translate-y-1 hover:border-accent hover:bg-card-raised focus-visible:outline-2 focus-visible:outline-focus-ring"
              style={{
                transitionTimingFunction: 'var(--ease, cubic-bezier(0.2, 0, 0, 1))',
              }}
            >
              {/* Card Top: Identity & Role */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-primary group-hover:text-accent">
                      {member.name}
                    </h3>
                    <p className="font-mono text-xs uppercase tracking-wider text-secondary">
                      {t(member.role)}
                    </p>
                  </div>
                  <span className="rounded-md border border-default bg-card-raised px-2 py-0.5 font-mono text-xs text-secondary">
                    {member.id}
                  </span>
                </div>

                {/* QR Badge Display */}
                <div className="flex justify-center py-2">
                  <div className="rounded-lg border border-default bg-card-raised p-2 transition-colors duration-[var(--dur-fast,150ms)] group-hover:border-accent/40">
                    <CrewQR crewId={member.id} size={140} />
                  </div>
                </div>

                {/* Metric Count Summary */}
                <div className="space-y-1.5 border-t border-default pt-4">
                  <div className="flex items-center justify-between text-xs text-secondary">
                    <span className="flex items-center gap-1.5 font-medium text-primary">
                      <Icon name="metrics" size={14} className="text-accent" />
                      <span>{t("{count} baseline metrics", { count })}</span>
                    </span>
                    <span className="font-mono text-[11px] text-secondary">
                      {totalReadings} {t("readings")}
                    </span>
                  </div>

                  {/* Summary metric indicators */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 rounded bg-card-raised px-2 py-0.5 text-[11px] text-secondary">
                      <Icon name="sleep" size={12} /> {t("Sleep")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-card-raised px-2 py-0.5 text-[11px] text-secondary">
                      <Icon name="heart-pulse" size={12} /> {t("HRV")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-card-raised px-2 py-0.5 text-[11px] text-secondary">
                      <Icon name="checkin" size={12} /> {t("Exercise")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-card-raised px-2 py-0.5 text-[11px] text-secondary">
                      <Icon name="spaceweather" size={12} /> {t("Radiation")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-card-raised px-2 py-0.5 text-[11px] text-secondary">
                      <Icon name="note" size={12} /> {t("Mood")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="mt-6 flex items-center justify-between border-t border-default pt-4 text-xs font-medium text-accent">
                <span>{t("Open baseline brief")}</span>
                <span className="transition-transform duration-[var(--dur-fast,150ms)] group-hover:translate-x-1">
                  <Icon name="arrow" size={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
