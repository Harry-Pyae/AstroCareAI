import { Link } from 'react-router-dom';
import type { TaskContext } from '../../lib/types';
import { useI18n } from '../../i18n/LanguageProvider';
import Icon from '../icons/Icon';
import { timeUntil } from './format';

export default function TaskCard({ task, now }: { task?: TaskContext; now: Date }) {
  const { t, date } = useI18n();
  return <section className="brief-panel motion-mount border-default bg-card" aria-labelledby="task-heading">
    <div className="brief-panel-header"><h2 id="task-heading">{t('Upcoming task context')}</h2><Icon name="schedule" size={20} className="text-secondary" /></div>
    {task ? <>
      <p className="brief-eyebrow text-secondary">{timeUntil(task.scheduledFor, now, t)}</p>
      <h3 className="mt-3">{t(task.title)}</h3>
      <p className="text-secondary mt-2 text-xs"><time dateTime={task.scheduledFor}>{date(task.scheduledFor)}</time></p>
      <div className="brief-chip-list">{task.attentionDemands.map(demand => <span className="brief-chip border-default bg-card-raised" key={demand}>{t(demand)}</span>)}</div>
      <p className="text-secondary">{t('Review suggested before tasks with sustained attention demands.')}</p>
    </> : <div className="brief-empty text-secondary">
      <p>{t('No upcoming task is recorded for this crew member.')}</p>
      <p className="mt-2">{t('Review personal observations or')} <Link to="/" className="brief-link text-accent">{t('choose another astronaut')}</Link>.</p>
    </div>}
  </section>;
}
