import { Link } from 'react-router-dom';
import type { TaskContext } from '../../lib/types';
import { formatTime, timeUntil } from './format';
import Icon from './Icon';
export default function TaskCard({ task, now }: { task?: TaskContext; now: Date }) {
  return <section className="brief-panel" aria-labelledby="task-heading"><div className="brief-panel-header"><h2 id="task-heading">Upcoming task context</h2><Icon name="calendar" /></div>
    {task ? <><p className="brief-eyebrow">{timeUntil(task.scheduledFor, now)}</p><h3 className="mt-3">{task.title}</h3><p className="brief-muted mt-2 text-xs"><time dateTime={task.scheduledFor}>{formatTime(task.scheduledFor)}</time></p><div className="brief-chip-list">{task.attentionDemands.map(demand => <span className="brief-chip" key={demand}>{demand}</span>)}</div><p className="brief-muted">Review suggested before tasks with sustained attention demands.</p></> : <div className="brief-empty"><p>No upcoming task is recorded for this crew member.</p><p className="mt-2">Review personal observations or <Link to="/" className="brief-link">choose another astronaut</Link>.</p></div>}
  </section>;
}
