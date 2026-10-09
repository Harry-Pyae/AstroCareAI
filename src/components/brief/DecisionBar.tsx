import { useI18n } from '../../i18n/LanguageProvider';
import { useState, type FormEvent } from 'react';
import type { Decision } from '../../lib/types';
import Icon from '../icons/Icon';
import Button from '../ui/Button';
import DataList from '../ui/DataList';

const actions = [
  { action: 'recheck', label: 'Recheck', icon: 'recheck' },
  { action: 'request_review', label: 'Request review', icon: 'note' },
  { action: 'propose_schedule_change', label: 'Propose schedule change', icon: 'calendar' },
] as const;

export default function DecisionBar({ decisions, onSave }: { decisions: Decision[]; onSave: (action: Decision['action'], note: string) => void }) {
  const { t, date } = useI18n();
  const [selected, setSelected] = useState<Decision['action'] | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const labelFor = (action: Decision['action']) => t(actions.find(item => item.action === action)?.label ?? 'Recorded decision');
  function reset() { setSelected(null); setNote(''); setError(''); }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try { onSave(selected, note.trim()); reset(); }
    catch { setError('Decision could not be saved. Check browser storage access and try again.'); }
  }
  const history = [...decisions].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  return <section className="brief-panel" aria-labelledby="decision-heading">
    <h2 id="decision-heading">{t('What would you like to do?')}</h2>
    <p className="brief-muted mt-2">{t('Choose a next step for your own review. Requests and proposals are recorded locally.')}</p>
    <div className="mt-5 grid gap-2">
      {actions.map(({ action, label, icon }) => <Button key={action} className="justify-start" aria-pressed={selected === action} onClick={() => { setSelected(action); setNote(''); setError(''); }}>
        <Icon name={icon} size={18} />{t(label)}
      </Button>)}
    </div>
    {selected && <form onSubmit={submit} className="motion-mount mt-5">
      <label htmlFor="decision-note" className="text-sm">{labelFor(selected)} · {t('optional note')}</label>
      <input autoFocus id="decision-note" className="brief-field" type="text" maxLength={280} value={note} onChange={event => setNote(event.target.value)} placeholder={t('Add a short note for your next review')} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="submit" variant="primary">{t('Save decision')}</Button>
        <Button variant="ghost" onClick={reset}>{t('Cancel')}</Button>
      </div>
    </form>}
    {error && <p role="alert" className="mt-3 text-sm text-danger">{t(error)}</p>}
    <div className="mt-6 border-t border-default pt-5">
      <h3 className="mb-3">{t('Decision history')}</h3>
      {history.length ? <DataList label={t('Decision history')}
        columns={[{ key: 'action', title: t('Action'), width: 'minmax(0,1.1fr)' }, { key: 'note', title: t('Note'), width: 'minmax(0,1fr)' }, { key: 'time', title: t('Recorded'), numeric: true, width: 'auto' }]}
        rows={history.map((decision, index) => ({
          key: `${decision.timestamp}-${index}`,
          cells: {
            action: <span className="font-medium">{labelFor(decision.action)}</span>,
            note: <span className="text-secondary">{decision.note || '—'}</span>,
            time: <time dateTime={decision.timestamp} className="text-xs text-secondary">{date(decision.timestamp)}</time>,
          },
        }))} /> : <p className="brief-empty">{t('No decisions recorded yet. Choose a next step above to start your history.')}</p>}
    </div>
  </section>;
}
