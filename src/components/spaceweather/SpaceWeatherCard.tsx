import { useEffect, useState } from 'react';
import fallbackData from '../../data/spaceweather-fallback.json';

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
function displayTime(value: string) { return new Date(value).toLocaleString(undefined, { timeZone:'UTC', month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:false }) + ' UTC'; }

export default function SpaceWeatherCard() {
  const [events,setEvents] = useState<SolarFlare[]>(cachedEvents);
  const [cached,setCached] = useState(true);
  const [loading,setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    const endDate = new Date().toISOString().slice(0,10);
    const start = new Date(); start.setUTCDate(start.getUTCDate()-60);
    const params = new URLSearchParams({ startDate:start.toISOString().slice(0,10), endDate, api_key:'DEMO_KEY' });
    fetch(`https://api.nasa.gov/DONKI/FLR?${params}`, { signal:controller.signal })
      .then(response => { if (!response.ok) throw new Error('Request failed'); return response.json(); })
      .then(data => { const rows = recentFlares(data); if (!rows.length) throw new Error('No usable events'); if (active) { setEvents(rows); setCached(false); } })
      .catch(() => { if (active) { setEvents(cachedEvents); setCached(true); } })
      .finally(() => { window.clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active=false; window.clearTimeout(timeout); controller.abort(); };
  }, []);
  return <section aria-label='Space weather context' className='rounded-lg border border-neutral-800 bg-neutral-900 p-5'>
    <h2 className='text-lg text-neutral-100'>Space weather context</h2>
    <p className='mt-1 text-sm text-neutral-400'>Recent solar activity — NASA DONKI{cached ? ' (cached)' : ''}</p>
    {cached ? <p className='mt-2 text-xs text-neutral-400'>Illustrative cached demo events.</p> : null}
    {loading ? <p role='status' className='mt-2 text-xs text-neutral-400'>Checking for live events…</p> : null}
    {events.length ? <ul className='mt-4 divide-y divide-neutral-800'>{events.map(event => <li key={event.flrID} className='flex flex-wrap justify-between gap-2 py-3'><span className='font-mono text-sm text-neutral-100'>Class {event.classType}</span><span className='text-xs text-neutral-400'>Peak <time dateTime={event.peakTime}>{displayTime(event.peakTime)}</time></span></li>)}</ul> : <p className='mt-4 text-sm text-neutral-400'>Solar activity context is unavailable.</p>}
    <p className='mt-4 text-xs leading-relaxed text-neutral-400'>Space-weather context only. These events do not explain or assess a crew member’s readings.</p>
  </section>;
}
