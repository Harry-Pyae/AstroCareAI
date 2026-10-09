import { useState, type FormEvent } from 'react';
import type { Decision } from '../../lib/types';
import { formatTime } from './format';

const actions: { action: Decision['action']; label: string }[] = [
  { action: 'recheck', label: 'Recheck' },
  { action: 'request_review', label: 'Request review' },
  { action: 'propose_schedule_change', label: 'Propose schedule change' },
];

export default function DecisionBar({ decisions, onSave }: { decisions: Decision[]; onSave: (action: Decision['action'], note: string) => void }) {
  const [selected, setSelected] = useState<Decision['action'] | null>(null);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try {
      onSave(selected, note.trim());
      setSelected(null);
      setNote('');
      setMessage('Decision saved on this device.');
    } catch {
      setMessage('Decision could not be saved. Check browser storage access and try again.');
    }
  }
  return <section aria-labelledby="decision-heading" className="rounded-xl border border-neutral-800 p-5">
    <h2 id="decision-heading" className="text-lg font-medium text-neutral-100">Choose your next step</h2>
    <p className="mt-1 text-sm text-neutral-400">Record a decision for your own review. Requests and proposals are recorded locally.</p>
    <div className="mt-4 flex flex-wrap gap-3">{actions.map(({ action, label }) => <button key={action} type="button" aria-pressed={selected === action} onClick={() => { setSelected(action); setNote(''); setMessage(''); }} className={`rounded-lg border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${selected === action ? 'border-amber-600 bg-amber-950/40 text-amber-200' : 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-neutral-500'}`}>{label}</button>)}</div>
    {selected && <form onSubmit={submit} className="mt-4 rounded-lg border border-neutral-700 bg-neutral-900/50 p-4"><label htmlFor="decision-note" className="block text-sm text-neutral-300">{actions.find(item => item.action === selected)?.label} · optional note</label><input autoFocus id="decision-note" type="text" maxLength={280} value={note} onChange={event => setNote(event.target.value)} placeholder="Add a short note for your next review" className="mt-2 w-full rounded border border-neutral-600 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-amber-400 focus:outline-none" /><div className="mt-3 flex gap-3"><button type="submit" className="rounded bg-amber-300 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">Save decision</button><button type="button" onClick={() => { setSelected(null); setNote(''); }} className="rounded px-3 py-2 text-sm text-neutral-400 hover:text-neutral-200">Cancel</button></div></form>}
    <p role="status" className="mt-3 text-sm text-neutral-300">{message}</p>
    <div className="mt-5 border-t border-neutral-800 pt-5"><h3 className="font-mono text-xs uppercase tracking-wider text-neutral-400">Decision history</h3>{decisions.length ? <ol className="mt-3 divide-y divide-neutral-800">{[...decisions].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).map((decision, index) => <li key={`${decision.timestamp}-${index}`} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium text-neutral-200">{actions.find(item => item.action === decision.action)?.label ?? 'Recorded decision'}</span><time dateTime={decision.timestamp} className="text-xs text-neutral-500">{formatTime(decision.timestamp)}</time></div>{decision.note && <p className="mt-1 break-words text-sm text-neutral-400">{decision.note}</p>}</li>)}</ol> : <p className="mt-3 text-sm text-neutral-500">No decisions recorded yet.</p>}</div>
  </section>;
}
