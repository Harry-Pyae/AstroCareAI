import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/LanguageProvider';
import Icon from '../icons/Icon';
import fallbackData from '../../data/spaceweather-fallback.json';
import { loadSpaceWeather, recentFlares, type SpaceWeatherState } from './client';

const cachedEvents = recentFlares(fallbackData);

export default function SpaceWeatherCard() {
  const { t, date } = useI18n();
  const [state, setState] = useState<SpaceWeatherState>({ events: cachedEvents, cached: true, message: '' });
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    loadSpaceWeather(cachedEvents, controller.signal)
      .then(result => { if (active) setState(result); })
      .finally(() => { window.clearTimeout(timeout); if (active) { setLoading(false); setCheckedAt(new Date().toISOString()); } });
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, []);
  return <section aria-label={t('Space weather context')} className="motion-mount rounded-xl border border-default bg-card p-5 text-primary sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-lg font-semibold"><Icon name="spaceweather" size={20} className="text-secondary" />{t('Space weather context')}</h2><p className="mt-1 text-sm text-secondary">{t('Recent solar activity · NASA DONKI')}</p></div>
      <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-default px-3 py-1 text-xs text-secondary"><Icon name={state.cached ? 'schedule' : 'check'} size={16} />{t(state.cached ? 'Cached demonstration data' : 'Live data')}</span>
    </div>
    {loading && <p role="status" aria-live="polite" className="mt-3 text-sm text-secondary">{t('Checking for recent solar flares… Cached events remain available.')}</p>}
    {state.message && !loading && <p role="status" className="mt-3 text-sm text-secondary">{t(state.message)}</p>}
    {state.fetchedAt && <p className="mt-3 text-xs text-secondary">{t('NASA data retrieved')} <time dateTime={state.fetchedAt}>{date(state.fetchedAt, { timeZone: 'UTC', year: 'numeric', hour12: false })}</time></p>}
    {state.events.length ? <ul className="mt-4 divide-y divide-default">{state.events.map(event => <li key={event.flrID} className="grid min-h-11 gap-2 py-3 sm:grid-cols-2"><span className="font-mono text-sm font-medium">{t('weather.solarFlare')} · {t('Class')} {event.classType}</span><span className="text-sm text-secondary sm:text-right">{t('Peak')} <time dateTime={event.peakTime}>{date(event.peakTime, { timeZone: 'UTC', year: 'numeric', hour12: false })}</time></span>{!state.cached && event.submissionTime && <span className="text-xs text-secondary">{t('weather.updated')}: <time dateTime={event.submissionTime}>{date(event.submissionTime, { timeZone: 'UTC', year: 'numeric', hour12: false })}</time></span>}{!state.cached && event.link && <a className="min-h-11 break-words text-xs text-accent underline underline-offset-4 sm:text-right" href={event.link} target="_blank" rel="noopener noreferrer">{t('weather.nasaSource')}</a>}</li>)}</ul> : <p className="mt-4 rounded-lg border border-default p-4 text-sm text-secondary">{t('No solar flare events were returned for the requested period.')}</p>}
    {state.cached && <p className="mt-4 text-xs text-secondary">{t('Synthetic cached demonstration events — not live NASA readings.')}</p>}
    {checkedAt && <p className="mt-3 text-xs text-secondary">{t('weather.checked')}: <time dateTime={checkedAt}>{date(checkedAt, { timeZone: 'UTC', year: 'numeric', hour12: false })}</time></p>}
    <p className="mt-3 text-xs text-secondary">{t('weather.source')}: <a href="https://ccmc.gsfc.nasa.gov/DONKI/api/" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">{t('NASA DONKI')}</a></p>
    <p className="mt-3 text-xs leading-relaxed text-secondary">{t('Space-weather context only. These events do not explain or assess a crew member’s readings.')}</p>
  </section>;
}
