import React from 'react';
import { useDemo } from './DemoProvider';

export function DemoStatusChip() {
  const { active } = useDemo();

  if (!active) return null;

  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-accent-review/40 bg-accent-review/10 px-3 text-xs font-medium text-accent-review">
      <span aria-hidden="true">✨</span> Synthetic data
    </span>
  );
}
