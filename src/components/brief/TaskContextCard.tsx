import React, { useState, useEffect } from 'react';
import { TaskContext } from '../../lib/types';

interface TaskContextCardProps {
  task: TaskContext | null;
}

export const TaskContextCard: React.FC<TaskContextCardProps> = ({ task }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!task) return;

    const updateRemaining = () => {
      const now = new Date();
      const scheduled = new Date(task.scheduledFor);
      
      if (isNaN(scheduled.getTime())) {
        setTimeRemaining('Invalid date');
        return;
      }

      const diff = scheduled.getTime() - now.getTime();
      if (diff < 0) {
        setTimeRemaining('Past due');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`T-${hours}h ${minutes}m`);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000);
    return () => clearInterval(interval);
  }, [task]);

  if (!task) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-400">
        No upcoming tasks scheduled.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-2">Upcoming Task</h3>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h4 className="text-lg text-white font-medium">{task.title}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-gray-300 text-sm">{new Date(task.scheduledFor).toLocaleString()}</span>
            <span className="font-mono text-amber-500 font-bold text-sm bg-amber-500/10 px-2 py-0.5 rounded">
              {timeRemaining}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {task.attentionDemands.map((demand, i) => (
            <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
              {demand}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-700">
        <p className="text-gray-400 text-sm">
          Review suggested before tasks with sustained attention demands.
        </p>
      </div>
    </div>
  );
};
