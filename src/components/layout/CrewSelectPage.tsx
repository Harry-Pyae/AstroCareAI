import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageProvider';
import type { Observation } from '../../lib/types';
import CrewQR from '../qr/CrewQR';
import Icon from '../icons/Icon';
import { useCrew, useObservations, useTasks } from '../demo/DemoProvider';
import { ExploreDemoEntry } from '../demo/ExploreDemoEntry';

/**
 * Summarizes the tracked baseline metrics for a crew member.
 */
function getCrewMetricSummary(crewId: string, observations: Observation[]) {
  const memberObs = observations.filter((o) => o.crewId === crewId);
  const metricSet = new Set(memberObs.map((o) => o.metric));
  return {
    count: metricSet.size,
    totalReadings: memberObs.length,
    latest: memberObs.reduce<string | null>((latest, reading) => !latest || Date.parse(reading.timestamp) > Date.parse(latest) ? reading.timestamp : latest, null),
  };
}

export default function CrewSelectPage() {
  const { t, date } = useI18n();
  const crew = useCrew();
  const observations = useObservations();
  const tasks = useTasks();

  return (
    <section className="motion-mount space-y-8" aria-labelledby="crew-select-heading">
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

      <ExploreDemoEntry />

      {/* Crew Badge Cards Grid - 24px gap (gap-6) & responsive 390px stacking */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {crew.map((member) => {
          const { count, totalReadings, latest } = getCrewMetricSummary(member.id, observations);
          const nextTask = tasks.filter(task => task.crewId === member.id && Date.parse(task.scheduledFor) >= Date.now()).sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor))[0];

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
                  <div className="min-w-0">
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

                  <p className="text-xs text-secondary">{t('Latest observation')}: {latest ? <time dateTime={latest}>{date(latest)}</time> : t('No observations available')}</p>

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
                  {nextTask ? <p className="pt-2 text-xs text-secondary"><Icon name="schedule" size={14} className="mr-1 inline-block" />{t(nextTask.title)} · <time dateTime={nextTask.scheduledFor}>{date(nextTask.scheduledFor)}</time></p> : <p className="pt-2 text-xs text-secondary">{t('No upcoming task is recorded for this crew member.')}</p>}
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
