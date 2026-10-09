import { useI18n } from "../../i18n/LanguageProvider";
import { Link } from 'react-router-dom';
import type { TaskContext } from '../../lib/types';
import { formatTime, timeUntil } from './format';
import Icon from '../icons/Icon';
export default function TaskCard({ task, now }: { task?: TaskContext; now: Date }) {
  const { t, language, date } = useI18n();
  return <section className="brief-panel" aria-labelledby="task-heading"><div className="brief-panel-header"><h2 id="task-heading">{t("Upcoming task context")}</h2><Icon name="schedule" size={18} className="text-secondary" /></div>
    {task ? <><p className="brief-eyebrow">{timeUntil(task.scheduledFor, now, t)}</p><h3 className="mt-3">{t(task.title)}</h3><p className="brief-muted mt-2 text-xs"><time dateTime={task.scheduledFor}>{date(task.scheduledFor)}</time></p><div className="brief-chip-list">{task.attentionDemands.map(demand => <span className="brief-chip" key={demand}>{t(demand)}</span>)}</div><p className="brief-muted">{t("Review suggested before tasks with sustained attention demands.")}</p></> : <div className="brief-empty"><p>{t("No upcoming task is recorded for this crew member.")}</p><p className="mt-2">{t("Review personal observations or")} <Link to="/" className="brief-link">{t("choose another astronaut")}</Link>.</p></div>}
  </section>;
}
