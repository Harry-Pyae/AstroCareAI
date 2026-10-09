import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/LanguageProvider';
import Icon from '../icons/Icon';
import Button from '../ui/Button';
import fallbackData from '../../data/spaceweather-fallback.json';
import { demonstrationSpaceWeather, getLastSuccessfulRetrieval, loadSpaceWeather, recentFlares, rememberSuccessfulRetrieval, retainGenuineResult, spaceWeatherIssueMessage, spaceWeatherLabel, SPACE_WEATHER_TIMEOUT_MS, SPACE_WEATHER_TYPES, type SpaceWeatherState, type SpaceWeatherType } from './client';

const cachedEvents = recentFlares(fallbackData);
const categoryLabels: Record<SpaceWeatherType, string> = { FLR: 'Solar flares', CME: 'Coronal mass ejections', GST: 'Geomagnetic storms', SEP: 'Solar energetic particles' };

export default function SpaceWeatherCard() {
  const { t, date } = useI18n();
  const [state, setState] = useState<SpaceWeatherState>(() => demonstrationSpaceWeather(cachedEvents));
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [lastSuccessfulRetrieval, setLastSuccessfulRetrieval] = useState(getLastSuccessfulRetrieval);
  const [request, setRequest] = useState(0);
  const [retryWait, setRetryWait] = useState(0);
  // A previous genuine result remains cached while a new request is pending.
  const delivery = loading && state.delivery === 'live_nasa' ? 'cached_nasa' : state.delivery;
  useEffect(() => {
    const seconds = state.retryAfterSeconds ?? 0;
    setRetryWait(seconds);
    if (!seconds) return;
    const until = Date.now() + seconds * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setRetryWait(remaining);
      if (!remaining) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), SPACE_WEATHER_TIMEOUT_MS);
    loadSpaceWeather(cachedEvents, controller.signal)
      .then(result => { if (active) { setState(previous => retainGenuineResult(previous, result)); setLastSuccessfulRetrieval(rememberSuccessfulRetrieval(result)); } })
      .finally(() => { window.clearTimeout(timeout); if (active) { setLoading(false); setCheckedAt(new Date().toISOString()); } });
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [request]);
  return <section aria-label={t('Space weather context')} className="motion-mount rounded-xl border border-default bg-card p-5 text-primary sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-lg font-semibold"><Icon name="spaceweather" size={20} className="text-secondary" />{t('Space weather context')}</h2><p className="mt-1 text-sm text-secondary">{t(delivery === 'synthetic' ? 'Illustrative solar activity · synthetic data' : 'Space-weather events · NASA DONKI')}</p></div>
      <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-default px-3 py-1 text-xs text-secondary"><Icon name={delivery === 'live_nasa' ? 'check' : 'schedule'} size={16} />{t(spaceWeatherLabel(delivery))}</span>
    </div>
    {loading && <p role="status" aria-live="polite" className="mt-3 text-sm text-secondary">{t('Checking NASA space-weather events… Existing data remains available.')}</p>}
    {state.message && !loading && <p role="status" className="mt-3 text-sm text-secondary">{t(state.message)}</p>}
    {state.retained && !loading && <p className="mt-3 text-xs text-secondary">{t('Showing previously retrieved NASA data; the latest request failed.')}</p>}
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Button variant="secondary" size="sm" disabled={loading || retryWait > 0} onClick={() => setRequest(value => value + 1)}>
        <Icon name="recheck" size={16} />{t(state.errorCode || state.partial ? 'Retry NASA request' : 'Refresh NASA data')}
      </Button>
      {retryWait > 0 && <p className="text-xs text-secondary">{t('weather.retryAfter', { seconds: retryWait })}</p>}
    </div>
    {lastSuccessfulRetrieval && <p className="mt-3 text-xs text-secondary">{t('Last successful NASA retrieval')}: <time dateTime={lastSuccessfulRetrieval}>{date(lastSuccessfulRetrieval, { timeZone: 'UTC', year: 'numeric', hour12: false })}</time></p>}
    {!loading && !lastSuccessfulRetrieval && <p className="mt-3 text-xs text-secondary">{t('No successful NASA retrieval in this session.')}</p>}
    {state.window && <p className="mt-4 text-xs text-secondary">{t('weather.requestWindow', { start: state.window.startDate, end: state.window.endDate })}</p>}
    <div className="mt-6 space-y-6">{SPACE_WEATHER_TYPES.map(type => {
      const category = state.categories.find(item => item.eventType === type)!;
      const genuine = delivery === 'live_nasa' || delivery === 'cached_nasa';
      return <section key={type} aria-label={t(categoryLabels[type])} className="border-t border-default pt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold"><Icon name="spaceweather" size={18} className="text-secondary" />{t(categoryLabels[type])}<span className="font-mono text-xs text-secondary">{type}</span></h3>
          {category.status === 'available' && <p className="text-xs tabular-nums text-secondary">{t(genuine ? 'weather.eventCount' : 'weather.demonstrationCount', { count: category.totalCount })}</p>}
        </div>
        {category.status === 'unavailable' ? <p className="mt-3 flex items-start gap-2 text-xs text-secondary"><Icon name="info" size={16} />{t(loading ? 'Checking this event type…' : 'NASA Data Unavailable')}{!loading && category.error && <span>· {t(spaceWeatherIssueMessage(category.error.code))}</span>}</p>
          : category.events.length ? <ul className="mt-3 space-y-4">{category.events.map(event => <li key={event.id} className="space-y-2 text-xs">
            <div className="flex flex-wrap justify-between gap-2"><span className="font-mono font-medium">{event.classification ? `${t('Class')} ${event.classification}` : t('Event recorded')}</span><time dateTime={event.occurredAt} className="text-secondary">{date(event.occurredAt, { timeZone: 'UTC', year: 'numeric', hour12: false })}</time></div>
            {genuine && event.submissionTime && <p className="text-secondary">{t('weather.updated')}: <time dateTime={event.submissionTime}>{date(event.submissionTime, { timeZone: 'UTC', year: 'numeric', hour12: false })}</time></p>}
            {genuine && event.link && <a className="inline-flex min-h-11 items-center break-words text-accent underline underline-offset-4" href={event.link} target="_blank" rel="noopener noreferrer">{t('weather.nasaSource')}</a>}
          </li>)}</ul> : <p className="mt-3 text-xs text-secondary">{t('No events returned for this type in the requested period.')}</p>}
        {category.totalCount > category.events.length && <p className="mt-3 text-xs text-secondary">{t('Showing the latest 3 events.')}</p>}
        {genuine && category.fetchedAt && <p className="mt-3 text-xs text-secondary">{t('NASA data retrieved')}: <time dateTime={category.fetchedAt}>{date(category.fetchedAt, { timeZone: 'UTC', year: 'numeric', hour12: false })}</time></p>}
      </section>;
    })}</div>
    {state.delivery === 'synthetic' && <p className="mt-4 text-xs text-secondary">{t('Synthetic cached demonstration events — not live NASA readings.')}</p>}
    {checkedAt && <p className="mt-3 text-xs text-secondary">{t('weather.checked')}: <time dateTime={checkedAt}>{date(checkedAt, { timeZone: 'UTC', year: 'numeric', hour12: false })}</time></p>}
    <p className="mt-3 text-xs text-secondary">{t('weather.source')}: {t(delivery === 'synthetic' ? 'Demonstration Data' : delivery === 'unavailable' ? 'NASA Data Unavailable' : 'NASA DONKI')}</p>
    <p className="mt-3 text-xs text-secondary"><a href="https://ccmc.gsfc.nasa.gov/DONKI/api/" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">{t('NASA DONKI API reference')}</a></p>
    <p className="mt-3 text-xs leading-relaxed text-secondary">{t('Space-weather context only. These events do not explain or assess a crew member’s readings.')}</p>
  </section>;
}
