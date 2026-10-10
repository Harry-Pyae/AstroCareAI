import { useI18n } from "../../i18n/LanguageProvider";
import { useEffect, useState } from 'react';
import fallbackData from '../../data/spaceweather-fallback.json';
import Icon from '../icons/Icon';

interface SolarFlare { flrID: string; beginTime: string; peakTime: string; classType: string; }
function recentFlares(data: unknown): SolarFlare[] {
  if (!Array.isArray(data)) return [];
  const events = data.filter((item): item is SolarFlare => {
    if (typeof item !== 'object' || item === null) return false;
    const row = item as Record<string, unknown>;
    return typeof row.flrID === 'string' && typeof row.beginTime === 'string' && Number.isFinite(Date.parse(row.beginTime)) && typeof row.peakTime === 'string' && Number.isFinite(Date.parse(row.peakTime)) && typeof row.classType === 'string' && /^[ABCMX]\d+(\.\d+)?$/.test(row.classType);
  });
  const seen = new Set<string>();
  return [...events].sort((a,b) => Date.parse(b.peakTime)-Date.parse(a.peakTime)).filter(e => !seen.has(e.flrID) && Boolean(seen.add(e.flrID))).slice(0,3);
}
const cachedEvents = recentFlares(fallbackData);

export default function SpaceWeatherCard() {
  const { t, date } = useI18n();
  const [events,setEvents] = useState<SolarFlare[]>(cachedEvents);
  const [cached,setCached] = useState(true);
  const [fetchedAt,setFetchedAt] = useState('');
  const [loading,setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    // Same-origin Vercel function (api/space-weather.ts): no NASA host or key in the browser.
    fetch('/api/space-weather', { signal:controller.signal })
      .then(response => { if (!response.ok) throw new Error('Request failed'); return response.json(); })
      .then(data => { const rows = recentFlares(data?.events); if (!rows.length) throw new Error('No usable events'); if (active) { setEvents(rows); setCached(false); setFetchedAt(typeof data.fetchedAt === 'string' ? data.fetchedAt : ''); } })
      .catch(() => { if (active) { setEvents(cachedEvents); setCached(true); } })
      .finally(() => { window.clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active=false; window.clearTimeout(timeout); controller.abort(); };
  }, []);
  return <section aria-label={t("Space weather context")} className='rounded-xl border border-default bg-card p-5 text-primary sm:p-6'>
    <div className='flex flex-wrap items-start justify-between gap-3'>
      <div>
        <h2 className='flex items-center gap-2 text-lg font-semibold'><Icon name='spaceweather' size={18} className='text-secondary' />{t("Space weather context")}</h2>
        <p className='mt-1 text-sm text-secondary'>{t("Recent solar activity · NASA DONKI")}</p>
      </div>
      <span className='inline-flex min-h-8 items-center gap-2 rounded-full border border-default px-3 py-1 text-xs text-secondary'>
        <Icon name={cached ? 'schedule' : 'check'} size={14} />{cached ? t("Cached demonstration data") : t("Live data")}
      </span>
    </div>
    {loading ? <div role='status' aria-label={t("Checking for recent solar flares… Cached events remain available.")} className='mt-4 space-y-3'>{[0, 1, 2].map(i => <div key={i} className='flex items-center justify-between gap-4'><div className='skeleton h-5 w-24' /><div className='skeleton h-5 w-40' /></div>)}</div>
    : events.length ? <ul className='mt-4 divide-y divide-default'>{events.map(event => <li key={event.flrID} className='flex min-h-11 flex-wrap items-center justify-between gap-2 py-3'><span className='font-mono text-sm font-medium'>{t("Class")} {event.classType}</span><span className='text-sm text-secondary'>{t("Peak")} <time dateTime={event.peakTime}>{date(event.peakTime, { timeZone: 'UTC', year: 'numeric', hour12: false })}</time></span></li>)}</ul> : <p className='mt-4 rounded-lg border border-default p-4 text-sm text-secondary'>{t("Solar activity context is unavailable. This does not affect the check-in or personal baseline brief.")}</p>}
    {cached ? <p className='mt-4 text-xs text-secondary'>{t("These are illustrative cached events, not current observations.")}</p>
    : fetchedAt ? <p className='mt-4 text-xs text-secondary'>{t("weather.fetched", { time: date(fetchedAt, { timeZone: 'UTC', hour12: false }) })}</p> : null}
    <p className='mt-3 text-xs leading-relaxed text-secondary'>{t("Space-weather context only. These events do not explain or assess a crew member’s readings.")}</p>
  </section>;
}
