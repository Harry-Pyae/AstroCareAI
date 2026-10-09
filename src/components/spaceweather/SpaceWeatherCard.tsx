import { useEffect, useState } from 'react';
import fallbackData from '../../data/spaceweather-fallback.json';

import { loadSpaceWeather, recentFlares, type SolarFlare } from './client';

const cachedEvents = recentFlares(fallbackData);
function displayTime(value: string) { return new Date(value).toLocaleString(undefined, { timeZone:'UTC', month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:false }) + ' UTC'; }

export default function SpaceWeatherCard() {
  const [events,setEvents] = useState<SolarFlare[]>(cachedEvents);
  const [cached,setCached] = useState(true);
  const [loading,setLoading] = useState(true);
  const [message,setMessage] = useState('');
  const [fetchedAt,setFetchedAt] = useState<string>();
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    loadSpaceWeather(cachedEvents, controller.signal)
      .then(state => { if (active) { setEvents(state.events); setCached(state.cached); setMessage(state.message); setFetchedAt(state.fetchedAt); } })
      .finally(() => { window.clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active=false; window.clearTimeout(timeout); controller.abort(); };
  }, []);
  return <section aria-label='Space weather context' className='rounded-lg border border-neutral-800 bg-neutral-900 p-5'>
    <h2 className='text-lg text-neutral-100'>Space weather context</h2>
    <p className='mt-1 text-sm text-neutral-400'>Recent solar activity — NASA DONKI{cached ? ' (cached)' : ''}</p>
    {cached ? <p className='mt-2 text-xs text-neutral-400'>Synthetic cached demonstration events — not live NASA readings.</p> : null}
    {loading ? <p role='status' className='mt-2 text-xs text-neutral-400'>Checking for live events…</p> : null}
    {message && !loading ? <p role='status' className='mt-2 text-xs text-neutral-400'>{message}</p> : null}
    {fetchedAt ? <p className='mt-2 text-xs text-neutral-400'>NASA data retrieved <time dateTime={fetchedAt}>{displayTime(fetchedAt)}</time></p> : null}
    {events.length ? <ul className='mt-4 divide-y divide-neutral-800'>{events.map(event => <li key={event.flrID} className='flex flex-wrap justify-between gap-2 py-3'><span className='font-mono text-sm text-neutral-100'>Class {event.classType}</span><span className='text-xs text-neutral-400'>Peak <time dateTime={event.peakTime}>{displayTime(event.peakTime)}</time></span></li>)}</ul> : <p className='mt-4 text-sm text-neutral-400'>Solar activity context is unavailable.</p>}
    <p className='mt-4 text-xs leading-relaxed text-neutral-400'>Space-weather context only. These events do not explain or assess a crew member’s readings.</p>
  </section>;
}
