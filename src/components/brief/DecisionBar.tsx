import { useState, type FormEvent } from 'react';
import type { Decision } from '../../lib/types';
import { useI18n } from '../../i18n/LanguageProvider';
import Icon from '../icons/Icon';
import DataList from '../ui/DataList';

const actions = [
  { action: 'recheck', label: 'Recheck', icon: 'recheck' },
  { action: 'request_review', label: 'Request review', icon: 'note' },
  { action: 'propose_schedule_change', label: 'Propose schedule change', icon: 'calendar' },
] as const;
const button = 'brief-button border-default bg-card-raised text-primary';

export default function DecisionBar({ decisions, onSave }: {
  decisions: Decision[]; onSave: (action: Decision['action'], note: string) => void;
}) {
  const { t, date } = useI18n();
  const [selected, setSelected] = useState<Decision['action'] | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  function cancel() { setSelected(null); setNote(''); setError(''); }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try { onSave(selected, note.trim()); cancel(); }
    catch { setError('Decision could not be saved. Check browser storage access and try again.'); }
  }
  const history = [...decisions].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  return <section className="brief-panel motion-mount border-default bg-card" aria-labelledby="decision-heading">
    <h2 id="decision-heading">{t('What would you like to do?')}</h2>
    <p className="text-secondary mt-2">{t('Choose a next step for your own review. Requests and proposals are recorded locally.')}</p>
    <div className="brief-action-list">{actions.map(({ action, label, icon }) => <button key={action} type="button" className={button}
      aria-pressed={selected === action} onClick={() => { setSelected(action); setNote(''); setError(''); }}>
      <Icon name={icon} size={18} />{t(label)}
    </button>)}</div>
    {selected && <form onSubmit={submit} className="mt-6">
      <label htmlFor="decision-note">{t(actions.find(item => item.action === selected)?.label ?? 'Note')} · {t('optional note')}</label>
      <input autoFocus id="decision-note" className="brief-field border-default bg-card-raised text-primary" type="text" maxLength={280}
        value={note} onChange={event => setNote(event.target.value)} placeholder={t('Add a short note for your next review')} />
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="submit" className={button}>{t('Save decision')}</button>
        <button type="button" className={button} onClick={cancel}>{t('Cancel')}</button>
      </div>
    </form>}
    {error && <p role="alert" className="mt-3 text-secondary">{t(error)}</p>}
    <div className="brief-history border-default">
      <h3 className="mb-4">{t('Decision history')}</h3>
      {history.length ? <DataList label={t('Decision history')}
        columns={[
          { key: 'action', title: t('Action'), width: 'minmax(0, 1fr)' },
          { key: 'note', title: t('Note'), width: 'minmax(0, 1fr)' },
          { key: 'recorded', title: t('Recorded'), width: 'minmax(0, 1fr)', numeric: true },
        ]}
        rows={history.map((decision, index) => ({
          key: decision.timestamp + ':' + index,
          cells: {
            action: <span className="font-medium">{t(actions.find(item => item.action === decision.action)?.label ?? 'Recorded decision')}</span>,
            note: <span className="text-secondary">{decision.note || '—'}</span>,
            recorded: <time dateTime={decision.timestamp} className="text-xs text-secondary">{date(decision.timestamp)}</time>,
          },
        }))} /> : <p className="brief-empty text-secondary">{t('No decisions recorded yet. Choose a next step above to start your history.')}</p>}
    </div>
  </section>;
}
