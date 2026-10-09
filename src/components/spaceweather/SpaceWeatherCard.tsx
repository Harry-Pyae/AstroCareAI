import { useEffect, useState } from 'react';
import fallbackData from '../../data/spaceweather-fallback.json';
import { useI18n } from '../../i18n/LanguageProvider';

interface SolarFlare {
  flrID: string;
  beginTime: string;
  peakTime: string;
  classType: string;
  submissionTime?: string;
  link?: string;
}

function nasaLink(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'nasa.gov' || url.hostname.endsWith('.nasa.gov')) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function recentFlares(data: unknown): SolarFlare[] {
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  return data.flatMap((item): SolarFlare[] => {
    if (typeof item !== 'object' || item === null) return [];
    const row = item as Record<string, unknown>;
    if (typeof row.flrID !== 'string' || typeof row.beginTime !== 'string'
      || !Number.isFinite(Date.parse(row.beginTime)) || typeof row.peakTime !== 'string'
      || !Number.isFinite(Date.parse(row.peakTime)) || typeof row.classType !== 'string'
      || !/^[ABCMX]\d+(\.\d+)?$/.test(row.classType)) return [];
    return [{
      flrID: row.flrID,
      beginTime: row.beginTime,
      peakTime: row.peakTime,
      classType: row.classType,
      submissionTime: typeof row.submissionTime === 'string' && Number.isFinite(Date.parse(row.submissionTime)) ? row.submissionTime : undefined,
      link: nasaLink(row.link),
    }];
  }).sort((a, b) => Date.parse(b.peakTime) - Date.parse(a.peakTime))
    .filter((event) => !seen.has(event.flrID) && Boolean(seen.add(event.flrID))).slice(0, 3);
}

const cachedEvents = recentFlares(fallbackData);
type SourceState = 'loading' | 'live' | 'cached' | 'empty';

export default function SpaceWeatherCard() {
  const { t, date } = useI18n();
  const [events, setEvents] = useState<SolarFlare[]>(cachedEvents);
  const [source, setSource] = useState<SourceState>('loading');
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    const endDate = new Date().toISOString().slice(0, 10);
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 60);
    const params = new URLSearchParams({ startDate: start.toISOString().slice(0, 10), endDate, api_key: 'DEMO_KEY' });
    fetch(`https://api.nasa.gov/DONKI/FLR?${params}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('NASA request failed'); return response.json(); })
      .then((data: unknown) => {
        if (!active) return;
        const rows = recentFlares(data);
        setEvents(rows);
        setSource(rows.length ? 'live' : 'empty');
      })
      .catch(() => {
        if (!active) return;
        setEvents(cachedEvents);
        setSource('cached');
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setCheckedAt(new Date().toISOString());
      });
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, []);

  const illustrative = source === 'loading' || source === 'cached';
  return <section aria-label={t('Space weather context')} className="rounded-xl border border-default bg-card p-5 text-primary sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">{t('Space weather context')}</h2>
        <p className="mt-1 text-sm text-secondary">{t('Recent solar activity · NASA DONKI')}</p>
      </div>
      <span className="inline-flex min-h-8 items-center rounded-full border border-default px-3 py-1 text-xs text-secondary">
        {source === 'live' ? t('Live data') : source === 'empty' ? t('weather.noRecent') : t('Cached demonstration data')}
      </span>
    </div>
    {source === 'loading' ? <p role="status" aria-live="polite" className="mt-3 text-sm text-secondary">{t('Checking for recent solar flares… Cached events remain available.')}</p> : null}
    {source === 'cached' ? <p role="status" className="mt-3 text-sm text-danger">{t('weather.apiUnavailable')}</p> : null}
    {source === 'empty' ? <p role="status" className="mt-4 rounded-lg border border-default p-4 text-sm text-secondary">{t('weather.empty')}</p> : null}
    {events.length && source !== 'empty' ? <ul className="mt-4 divide-y divide-default">{events.map((event) => <li key={event.flrID} className="grid gap-1 py-3 text-sm sm:grid-cols-2">
      <span className="font-mono font-medium">{t('weather.solarFlare')} · {t('Class')} {event.classType}</span>
      <span className="text-secondary sm:text-right">{t('Peak')}: <time dateTime={event.peakTime}>{date(event.peakTime, { timeZone: 'UTC', year: 'numeric', hour12: false })} {t('UTC')}</time></span>
      {source === 'live' && event.submissionTime ? <span className="text-xs text-secondary">{t('weather.updated')}: <time dateTime={event.submissionTime}>{date(event.submissionTime, { timeZone: 'UTC', year: 'numeric', hour12: false })} {t('UTC')}</time></span> : null}
      {source === 'live' && event.link ? <a href={event.link} target="_blank" rel="noopener noreferrer" className="min-h-11 break-words text-xs text-accent underline underline-offset-4 focus-ring sm:text-right">{t('weather.nasaSource')}</a> : null}
    </li>)}</ul> : null}
    {illustrative ? <p className="mt-4 text-xs text-secondary">{t('These are illustrative cached events, not current observations.')}</p> : null}
    {checkedAt ? <p className="mt-3 text-xs text-secondary">{t('weather.checked')}: <time dateTime={checkedAt}>{date(checkedAt, { timeZone: 'UTC', year: 'numeric', hour12: false })} {t('UTC')}</time></p> : null}
    <p className="mt-3 text-xs text-secondary">{t('weather.source')}: <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 focus-ring">{t('NASA DONKI')}</a></p>
    <p className="mt-3 text-xs leading-relaxed text-secondary">{t('Space-weather context only. These events do not explain or assess a crew member’s readings.')}</p>
  </section>;
}
