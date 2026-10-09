import { useI18n } from "../../i18n/LanguageProvider";
import { useState, type FormEvent } from 'react';
import type { Decision } from '../../lib/types';
import { formatTime } from './format';
import Icon from './Icon';

const actions = [
  { action: 'recheck', label: 'Recheck', icon: 'recheck' },
  { action: 'request_review', label: 'Request review', icon: 'note' },
  { action: 'propose_schedule_change', label: 'Propose schedule change', icon: 'calendar' },
] as const;

export default function DecisionBar({ decisions, onSave }: { decisions: Decision[]; onSave: (action: Decision['action'], note: string) => void }) {
  const { t, language, date } = useI18n();
  const [selected, setSelected] = useState<Decision['action'] | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try { onSave(selected, note.trim()); setSelected(null); setNote(''); setError(''); }
    catch { setError('Decision could not be saved. Check browser storage access and try again.'); }
  }
  return <section className="brief-panel" aria-labelledby="decision-heading"><h2 id="decision-heading">{t("What would you like to do?")}</h2><p className="brief-muted mt-2">{t("Choose a next step for your own review. Requests and proposals are recorded locally.")}</p>
    <div className="brief-action-list">{actions.map(({ action, label, icon }) => <button key={action} type="button" className="brief-button" aria-pressed={selected === action} onClick={() => { setSelected(action); setNote(''); setError(''); }}><Icon name={icon} />{t(label)}</button>)}</div>
    {selected && <form onSubmit={submit} className="mt-5"><label htmlFor="decision-note">{t(actions.find(item => item.action === selected)?.label ?? 'Note')} · {t('optional note')}</label><input autoFocus id="decision-note" className="brief-field" type="text" maxLength={280} value={note} onChange={event => setNote(event.target.value)} placeholder={t("Add a short note for your next review")} /><div className="mt-3 flex flex-wrap gap-2"><button type="submit" className="brief-button">{t("Save decision")}</button><button type="button" className="brief-button" onClick={() => { setSelected(null); setNote(''); setError(''); }}>{t("Cancel")}</button></div></form>}
    {error && <p role="alert" className="mt-3 brief-muted">{t(error)}</p>}
    <div className="brief-history"><h3>{t("Decision history")}</h3>{decisions.length ? <ol>{[...decisions].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).map((decision, index) => <li key={`${decision.timestamp}-${index}`}><p className="font-medium">{t(actions.find(item => item.action === decision.action)?.label ?? 'Recorded decision')}</p><time dateTime={decision.timestamp} className="brief-muted text-xs">{date(decision.timestamp)}</time>{decision.note && <p className="brief-muted mt-1">{decision.note}</p>}</li>)}</ol> : <p className="brief-empty">{t("No decisions recorded yet. Choose a next step above to start your history.")}</p>}</div>
  </section>;
}
