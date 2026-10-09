import type { TaskContext } from '../../lib/types';
import { formatTime, timeUntil } from './format';

export default function TaskCard({ task, now }: { task?: TaskContext; now: Date }) {
  return <section aria-labelledby="task-heading" className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
    <h2 id="task-heading" className="font-mono text-xs uppercase tracking-widest text-neutral-400">Upcoming task context</h2>
    {task ? <><div className="mt-3 flex flex-wrap items-start justify-between gap-3"><h3 className="text-lg font-medium text-neutral-100">{task.title}</h3><span className="rounded border border-neutral-700 px-2 py-1 font-mono text-xs text-neutral-300">{timeUntil(task.scheduledFor, now)}</span></div><p className="mt-1 text-sm text-neutral-400"><time dateTime={task.scheduledFor}>{formatTime(task.scheduledFor)}</time></p><div className="mt-4 flex flex-wrap gap-2">{task.attentionDemands.map(demand => <span key={demand} className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300">{demand}</span>)}</div><p className="mt-4 text-sm text-neutral-400">Review suggested before tasks with sustained attention demands.</p></> : <p className="mt-3 text-sm text-neutral-400">No upcoming task is recorded for this crew member.</p>}
  </section>;
}
